import os
import re
import time
import logging
from typing import Optional, Dict, Tuple, List
import httpx
from sqlalchemy.orm import Session

from app.modules.chatbot.schemas import (
    ChatQueryRequest,
    ChatQueryResponse,
    SourceCitation,
    QuickPromptItem,
)
from app.modules.chatbot.upcycling_library import (
    find_matching_upcycling_project,
    CURATED_UPCYCLING_PROJECTS,
)
from app.modules.identity.models import User
from app.modules.schedules.models import Schedule, ScheduleAdvisory
from app.modules.areas.models import Area

logger = logging.getLogger(__name__)

# 24-hour in-memory response cache: cache_key -> (timestamp, response_dict)
_CACHE: Dict[str, Tuple[float, dict]] = {}
CACHE_TTL_SECONDS = 86400  # 24 hours

# Circuit breaker timestamp for search tool rate-limit cooldown
_SEARCH_COOLDOWN_UNTIL: float = 0.0

def reset_chatbot_cache():
    """Helper to reset cache and circuit breaker cooldowns for clean test isolation."""
    global _SEARCH_COOLDOWN_UNTIL
    _CACHE.clear()
    _SEARCH_COOLDOWN_UNTIL = 0.0


def has_explicit_upcycling_intent(query: str) -> bool:
    """Determine if user explicitly requested a DIY upcycling guide, blueprint, or steps."""
    q = query.lower()
    diy_triggers = [
        "how to make", "paano gumawa", "paano mag-upcycle", "paano mag upcycle",
        "how to upcycle", "how to build", "paano mag-recycle", "paano mag recycle",
        "how to recycle", "step-by-step", "mga hakbang", "diy", "tutorial",
        "how to compost", "paano mag-compost", "paano mag compost",
        "paano gawing pataba", "paano gawing", "how to turn", "blueprint"
    ]
    return any(t in q for t in diy_triggers)


def is_off_topic_inquiry(message: str) -> bool:
    """Detect if query is off-topic, general trivia, identity, or non-waste inquiry."""
    q = message.lower()
    off_topic_patterns = [
        r'\b(president|pangulo)\b',
        r'\b(time|oras)\b',
        r'\b(weather|panahon|ulan|init)\b',
        r'\b(who\s+is|sino\s+(si|ang))\b',
        r'\b(what\s+is\s+your\s+name|anong\s+pangalan\s+mo)\b',
        r'\b(how\s+are\s+you|kumusta|kamusta)\b',
    ]
    waste_intent_keywords = [
        "basura", "waste", "recycle", "compost", "tapon", "hakot", "purok", "segregat",
        "upcycle", "eco", "bote", "plastik", "plastic", "sachet", "wrapper"
    ]
    has_waste_intent = any(w in q for w in waste_intent_keywords)
    return any(bool(re.search(pat, q)) for pat in off_topic_patterns) and not has_waste_intent


def has_legal_reference_intent(query: str) -> bool:
    """Determine if user explicitly asked for legal citations, laws, penalties, or DENR-EMB guidelines."""
    q = query.lower()
    legal_triggers = [
        "batas", "law", "ra 9003", "republic act", "ordinansa", "ordinance",
        "multa", "penalty", "penalties", "parusa", "legal", "denr", "emb",
        "guideline", "section", "probisyon", "bawal ba", "bawal"
    ]
    return any(t in q for t in legal_triggers)

def scrub_pii(text: str) -> str:
    """Strip personal identifiers (emails, phone numbers) to comply with RA 10173."""
    # Scrub email addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED_EMAIL]', text)
    # Scrub PH phone numbers (+639xxxxxxxxx or 09xxxxxxxxx)
    text = re.sub(r'(\+?63|0)9\d{9}', '[REDACTED_PHONE]', text)
    return text

# Content Moderation & Safety Guardrails (Violence, Illegal Acts, Profanity)
_SAFETY_VIOLENCE_PATTERN = re.compile(
    r'\b('
    r'kill|killing|murder|murderer|assassinate|slaughter|suicide|massacre|'
    r'genocide|homicide|barilin|saksakin|pumatay|pagpatay|magpakamatay|'
    r'kitlin|lasunin|salvage|ipapatay'
    r')\b|'
    r'(how\s+to\s+kill|paano\s+(pumatay|patayin)|patayin\s+kita)',
    re.IGNORECASE
)

_BENIGN_TARGET_PATTERN = re.compile(
    r'\b('
    r'bacteria|pathogens|pests|pest|flies|fruit\s+flies|insects|maggots|'
    r'odor|smell|germs|weeds|weed\s+seeds|fungus|mold|dengue|mosquitoes|'
    r'lamok|uod|peste|apoy|kalan|ilaw'
    r')\b',
    re.IGNORECASE
)

_SAFETY_ILLEGAL_PATTERN = re.compile(
    r'\b('
    r'shabu|droga|cocaine|heroin|methamphetamine|ecstasy|marijuana|'
    r'magnakaw|nakawan|holdap|mangholdap|holdup|arson|contraband'
    r')\b|'
    r'(paano\s+(magnakaw|mangholdap|gumawa\s+ng\s+bomba)|'
    r'how\s+to\s+(steal|rob|make\s+a\s+bomb|commit\s+fraud|hack))',
    re.IGNORECASE
)

_SAFETY_PROFANITY_PATTERN = re.compile(
    r'\b('
    r'tang\s*ina|putang\s*ina|pukinang\s*ina|puking\s*ina|puta|gago|gaga|'
    r'tarantado|ulol|hudas|kupal|pakshet|hinayupak|bobo|tanga|inutil|leche|'
    r'punyeta|pakyu|fuck|fucking|fucker|f\*ck|shit|sh\*t|bitch|b\*tch|'
    r'asshole|cunt|motherfucker|dickhead|bastard'
    r')\b',
    re.IGNORECASE
)

def evaluate_content_safety(text: str) -> Optional[str]:
    """
    Evaluate message for violations regarding violence, illegal acts, or profanity.
    Returns polite refusal message if a violation is detected, or None if safe.
    """
    clean = text.strip()
    if not clean:
        return None

    # Check direct and deobfuscated strings (e.g. f*ck, t*ngina)
    deobfuscated = re.sub(r'[*@_#\-\.]', '', clean.lower())

    # Check for violence (excluding benign household/agricultural sanitation context like pests or bacteria)
    has_violence = bool(
        _SAFETY_VIOLENCE_PATTERN.search(clean) or _SAFETY_VIOLENCE_PATTERN.search(deobfuscated)
    )
    if has_violence and _BENIGN_TARGET_PATTERN.search(clean):
        has_violence = False

    has_illegal = bool(
        _SAFETY_ILLEGAL_PATTERN.search(clean) or _SAFETY_ILLEGAL_PATTERN.search(deobfuscated)
    )
    has_profanity = bool(
        _SAFETY_PROFANITY_PATTERN.search(clean) or _SAFETY_PROFANITY_PATTERN.search(deobfuscated)
    )

    if not (has_violence or has_illegal or has_profanity):
        return None

    is_tagalog = bool(re.search(
        r'\b(ang|ng|mga|sa|paano|kailan|po|ako|mo|ba|ito|hindi|ano|bakit|saan|si|ka|tayo|kami)\b',
        clean,
        re.IGNORECASE
    ))

    if is_tagalog:
        return (
            "Paumanhin, hindi ako maaaring tumulong o sumagot sa mga katanungang may kinalaman sa karahasan, ilegal na gawain, o hindi angkop na pananalita.\n\n"
            "Ako si **EcoBot**, ang digital civic assistant ng Barangay Sabang na nakalaan lamang para sa tamang pagtatapon ng basura, iskedyul ng hakot, pagre-recycle (RA 9003), at kalinisan ng ating komunidad.\n\n"
            "Maaari mo akong tanungin ukol sa tamang pagbubukod ng basura o iskedyul sa inyong Purok."
        )
    else:
        return (
            "I apologize, but I cannot assist with inquiries involving violence, illegal activities, or inappropriate language.\n\n"
            "I am **EcoBot**, dedicated specifically to solid waste management, collection timetables, recycling (RA 9003), and civic sanitation in Barangay Sabang.\n\n"
            "Please feel free to ask about waste segregation, collection schedules, or barangay recycling initiatives."
        )

def get_schedule_context(db: Session, area_id: Optional[int] = None) -> str:
    """Fetch live collection schedule rules from database for grounding."""
    try:
        query = db.query(Schedule, Area).join(Area, Schedule.area_id == Area.id).filter(Schedule.is_active == True)
        if area_id:
            query = query.filter(Schedule.area_id == area_id)
        
        results = query.all()
        if not results:
            return "Official Barangay Sabang Schedule: Biodegradable on Mon/Wed/Fri 06:00 AM - 09:00 AM. Non-Biodegradable on Tue/Sat 06:00 AM - 09:00 AM. Recyclables on Wed 08:00 AM."
        
        lines = []
        for sched, area in results:
            lines.append(f"- {area.name}: {sched.day_of_week.value} ({sched.waste_type.value}) {sched.start_time} - {sched.end_time}. Notes: {sched.notes or 'None'}")
        
        # Check active advisories
        advisories = db.query(ScheduleAdvisory).filter(ScheduleAdvisory.is_active == True).all()
        if advisories:
            lines.append("Active Delay Advisories:")
            for adv in advisories:
                lines.append(f"  * {adv.title}: {adv.message} (Effective: {adv.effective_date})")
                
        return "\n".join(lines)
    except Exception as e:
        logger.warning(f"Could not load schedule context from DB: {e}")
        return "Schedules: Biodegradables (Green Bag) Mon/Wed/Fri; Non-Bio (Black Bag) Tue/Sat; Recyclables (Clear/White) Wed."

def get_api_keys() -> List[str]:
    """Retrieve configured Gemini API keys (supports comma-separated list for rotation)."""
    from app.core.config import settings
    raw_keys = (
        getattr(settings, "GEMINI_API_KEYS", None)
        or getattr(settings, "GEMINI_API_KEY", None)
        or os.getenv("GEMINI_API_KEYS")
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or ""
    )
    return [k.strip() for k in raw_keys.split(",") if k.strip()]

def get_quick_prompts() -> List[QuickPromptItem]:
    """Curated initial suggestion prompts for the citizen interface."""
    return [
        QuickPromptItem(
            id="prompt-1",
            category="UPCYCLING",
            prompt="Paano gawing kapaki-pakinabang ang mga balat ng prutas at gulay?",
            icon="Sprout",
        ),
        QuickPromptItem(
            id="prompt-2",
            category="UPCYCLING",
            prompt="How to make a self-watering vertical planter from plastic bottles?",
            icon="Recycle",
        ),
        QuickPromptItem(
            id="prompt-3",
            category="SCHEDULE",
            prompt="Kailan ang hakot ng nabubulok na basura sa aming Purok?",
            icon="Calendar",
        ),
        QuickPromptItem(
            id="prompt-4",
            category="POLICY",
            prompt="Anu-ano ang mga uri ng basura sa ilalim ng Republic Act 9003?",
            icon="ShieldCheck",
        ),
        QuickPromptItem(
            id="prompt-5",
            category="UPCYCLING",
            prompt="Paano gumawa ng eco-bricks mula sa mga plastic sachets at wrappers?",
            icon="Layers",
        ),
    ]

def query_ecobot(req: ChatQueryRequest, db: Session) -> ChatQueryResponse:
    """Main EcoBot query orchestrator with caching, live search, multi-turn history, and offline fallback."""
    clean_message = scrub_pii(req.message.strip())

    # 0. Content Moderation Guardrail (Filter violence, illegal activities, and profanity)
    safety_refusal = evaluate_content_safety(clean_message)
    if safety_refusal:
        return ChatQueryResponse(
            reply=safety_refusal,
            is_from_cache=False,
            is_fallback=True,
            model_used="safety-guardrail",
            citations=[],
            featured_project=None,
            suggested_prompts=[
                "Kailan ang hakot sa aming Purok?",
                "Tamang pagbubukod ng basura (RA 9003)",
                "Paano gumawa ng compost mula sa kitchen scraps?",
            ],
        )
    has_history = bool(req.history and len(req.history) > 0)
    cache_key = f"{req.area_id or 'all'}:{clean_message.lower()}"
    now = time.time()

    # 1. Check 24-hr In-Memory Cache (only for standalone queries without prior turn context)
    if not has_history and cache_key in _CACHE:
        cached_time, cached_data = _CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            res = ChatQueryResponse(**cached_data)
            res.is_from_cache = True
            return res

    # 2. Prepare Context (Barangay Schedule Context & Upcycling Match across conversation)
    sched_context = get_schedule_context(db, req.area_id)
    history_text = " ".join(t.get("content", "") for t in (req.history or []))
    combined_query = f"{history_text} {clean_message}".strip()
    is_off_topic = is_off_topic_inquiry(clean_message)

    # DEFAULT STATE IS NONE: Only trigger a DIY Blueprint when resident explicitly asks how to make/build/upcycle
    matched_project = None
    if not is_off_topic and has_explicit_upcycling_intent(combined_query):
        matched_project = find_matching_upcycling_project(combined_query)

    api_keys = get_api_keys()

    # Build multi-turn contents for contextual dialogue
    contents = []
    if req.history:
        for turn in req.history[-6:]:
            role = "model" if turn.get("role") in ["assistant", "bot", "model"] else "user"
            raw_content = turn.get("content") or turn.get("text") or ""
            scrubbed = scrub_pii(raw_content.strip())
            if scrubbed:
                if contents and contents[-1]["role"] == role:
                    contents[-1]["parts"][0]["text"] += f"\n{scrubbed}"
                else:
                    contents.append({"role": role, "parts": [{"text": scrubbed}]})

    if contents and contents[-1]["role"] == "user":
        contents[-1]["parts"][0]["text"] += f"\n{clean_message}"
    else:
        contents.append({"role": "user", "parts": [{"text": clean_message}]})

    # 3. Attempt Gemini API (Tier 1: Search Grounding -> Tier 2: Direct Generation)
    if api_keys:
        for key in api_keys:
            try:
                system_instruction = (
                    "You are EcoBot (SABTRACK AI), the official digital civic assistant for Barangay Sabang, Lipa City, "
                    "integrated into the SABTRACK Solid Waste Management & Resident Portal (version 3.0, protected under RA 10173).\n\n"
                    "Your mission is to guide residents on solid waste management, waste segregation under Republic Act 9003, "
                    "collection schedules, and navigating the SABTRACK portal.\n\n"
                    "1. FULL SABTRACK SYSTEM ARCHITECTURE & FEATURES:\n"
                    "• Incident Reports Tab (Waste Reporting Workflow):\n"
                    "  - How to Report: Go to the 'Incident Reports' tab > Click 'New Report' > Upload or take a photo of the uncollected garbage or illegal dumping > Select the category > Specify the location/Purok > Submit.\n"
                    "  - Status Pipeline: Submitted -> Under Review -> Dispatched -> Resolved.\n"
                    "  - Incentives: Residents earn SAB-Points for verified incident reports.\n"
                    "• Collection Schedules Tab:\n"
                    "  - Real-time tracking and schedule viewer for designated Puroks (Purok 1 through 7).\n"
                    "  - Shows assigned collection days and truck arrival windows for Biodegradable, Recyclable, and Residual waste.\n"
                    f"  - Official Schedule Data:\n{sched_context}\n"
                    "• Awareness Hub:\n"
                    "  - A dedicated portal library featuring curated video tutorials, Republic Act 9003 guidelines, and DIY upcycling guides.\n"
                    "  - Note: The Awareness Hub is a separate browsing section of the web app, NOT a widget inside the chat window.\n"
                    "• SAB-Points & Rewards:\n"
                    "  - Gamified civic incentives earned through consistent report verification, schedule compliance, and community participation.\n\n"
                    "2. SOLID WASTE & RA 9003 GUIDELINES:\n"
                    "• Biodegradable / Nabubulok (Green): Food waste, fruit and vegetable peels, fish/meat scraps, eggshells, dried leaves. Must be drained of excess liquid and kept covered.\n"
                    "• Recyclable / Nareresiklo (Blue): PET bottles, glass containers, aluminum and tin cans, clean cardboard, and paper. Golden Rule: Clean, Dry, and Empty (Banlawan at Patuyuin) before storage.\n"
                    "• Residual / Di-Nareresiklo (Black): Single-use sachets, snack wrappers, soiled plastics, worn-out rags, used sanitary pads, and disposable diapers.\n"
                    "• Special & Hazardous Waste (Red / Designated): Busted fluorescent bulbs/CFLs, vehicle batteries, household electronics (e-waste), empty aerosol/paint containers, expired medicines. Must be delivered directly to the Barangay MRF or scheduled special drop-offs.\n"
                    "• Enforcement Rules: Reiterate the 'No Segregation, No Collection' rule and the prohibition of open burning (pagsisiga).\n\n"
                    "3. WIDGET & BLUEPRINT SUPPRESSION (CRITICAL):\n"
                    "• DEFAULT STATE IS NONE. Do NOT generate, display, or append any `DIY UPCYCLING BLUEPRINT` cards, compost recipes, or reference boxes unless explicitly requested.\n"
                    "• NEVER attach blueprints or source boxes for:\n"
                    "  - System navigation questions (e.g., 'how to report in this website?').\n"
                    "  - Schedule inquiries.\n"
                    "  - Casual greetings or slang (e.g., 'werpa', 'hello', 'salamat').\n"
                    "  - Off-topic trivia or insults (e.g., 'who is our president', 'bading ka').\n"
                    "• ONLY trigger a DIY Blueprint when: The resident explicitly asks how to make an upcycling project, how to build a planter, or how to compost step-by-step (e.g., 'paano mag-upcycle ng plastic bottle?', 'paano gumawa ng compost?').\n"
                    "• ONLY trigger Reference Links when: The resident explicitly asks for the official law, legal penalties, or DENR-EMB guidelines.\n\n"
                    "4. MANDATORY SAFETY & TOPIC LIMITS (HANDLING UNRELATED, CASUAL, OR OFF-TOPIC QUERIES - CONCISE & NATURAL OFF-TOPIC RESPONSES):\n"
                    "• Factual General Trivia (e.g., 'who is our president'):\n"
                    "  - Answer directly in sentence 1: Give the factual answer immediately without conversational fluff.\n"
                    "  - One natural follow-up in sentence 2: Briefly ask if they need assistance with waste management, collection schedules, or barangay concerns.\n"
                    "  Example: 'Ang kasalukuyang Pangulo ng Pilipinas ay si Pangulong Ferdinand 'Bongbong' Marcos Jr. May maitutulong po ba ako kaugnay ng iskedyul ng hakot ng basura o serbisyo sa ating barangay?'\n"
                    "• Slang / Compliments (e.g., 'werpa sa imo', 'salamat'):\n"
                    "  1. Acknowledge warmly in 1 sentence.\n"
                    "  2. Ask how you can help.\n"
                    "  Example: 'Salamat po! How can I help you today?'\n"
                    "• Provocations / Trolling / Insults:\n"
                    "  1. State your civic identity calmly in 1 sentence without scolding or lecturing.\n"
                    "  Example: 'Isang digital civic assistant po ako ng Barangay Sabang. How can I help you today?'\n"
                    "• Serious Harm / Violence: Refuse inquiries involving killing, violence, suicide, weapons, illicit drugs, or arson.\n\n"
                    "5. LANGUAGE, TONE & CLOSING QUESTIONS:\n"
                    "• Language: Tagalog, Taglish, or English depending on how the user initiates the conversation. Use respectful phrasing ('po' / 'opo').\n"
                    "• Tone: Professional, encouraging, civic-minded, and direct. NEVER use cheesy or forced monikers like 'Ka-Sabang', 'Ka-barangay', or gimmicky slogans.\n"
                    "• Closing Question Rule: Always end your response with a brief closing question asking how you can help:\n"
                    "  - System questions: 'May maitutulong pa ba ako sa paggamit ng SABTRACK o sa inyong report?' or 'How can I help you today?'\n"
                    "  - Waste questions: 'May kailangan ka pa bang malaman tungkol sa waste segregation o iskedyul sa inyong Purok?'\n"
                    "  - Casual questions: 'How can I help you today?' or 'Ano po ang maipaglilingkod ko sa inyo ngayon?'"
                )

                data = None
                model_name = "gemini-flash-direct"
                global _SEARCH_COOLDOWN_UNTIL

                # Tier 1: Try Gemini with Google Search Grounding tool (fast failover & circuit breaker)
                if now > _SEARCH_COOLDOWN_UNTIL:
                    search_ep = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={key}"
                    payload_search = {
                        "system_instruction": {"parts": [{"text": system_instruction}]},
                        "contents": contents,
                        "tools": [{"google_search": {}}],
                        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600},
                        "safetySettings": [
                            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                        ]
                    }
                    try:
                        with httpx.Client(timeout=3.0) as client:
                            resp = client.post(search_ep, json=payload_search)
                            if resp.status_code == 200:
                                data = resp.json()
                                model_name = "gemini-flash-search"
                            elif resp.status_code == 429:
                                _SEARCH_COOLDOWN_UNTIL = now + 600.0  # Cooldown 10 mins
                                logger.info("Search tool rate limited (429); engaging fast direct generation cooldown.")
                    except Exception as e:
                        logger.debug(f"Search grounding attempt failed: {e}")

                # Tier 2: Direct Generation (Fast, resilient, ~1.0s latency)
                if not data:
                    direct_candidates = [
                        "gemini-flash-lite-latest",
                        "gemini-3.5-flash-lite",
                        "gemini-3.5-flash",
                    ]
                    payload_direct = {
                        "system_instruction": {"parts": [{"text": system_instruction}]},
                        "contents": contents,
                        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600},
                        "safetySettings": [
                            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                        ]
                    }
                    for mod in direct_candidates:
                        direct_ep = f"https://generativelanguage.googleapis.com/v1beta/models/{mod}:generateContent?key={key}"
                        try:
                            with httpx.Client(timeout=6.0) as client:
                                resp = client.post(direct_ep, json=payload_direct)
                                if resp.status_code == 200:
                                    data = resp.json()
                                    model_name = "gemini-flash-direct"
                                    break
                                else:
                                    logger.debug(f"Direct generation returned {resp.status_code} on {mod}")
                        except Exception as e:
                            logger.debug(f"Direct generation attempt failed on {mod}: {e}")

                if data:
                    candidates = data.get("candidates", [])
                    if candidates:
                        candidate = candidates[0]
                        parts = candidate.get("content", {}).get("parts", [])
                        reply_text = "\n".join(p.get("text", "") for p in parts if "text" in p).strip()
                        finish_reason = candidate.get("finishReason")
                        if finish_reason in ["SAFETY", "RECITATION"] or not reply_text:
                            logger.warning(f"Gemini output flagged by safety filter: {finish_reason}")
                            safety_msg = evaluate_content_safety(clean_message) or (
                                "Paumanhin, hindi ako maaaring magbigay ng impormasyon ukol sa paksang ito alinsunod sa ating community guidelines. Maaari kitang tulungan sa tamang pagtatapon ng basura, iskedyul ng hakot, o pagre-recycle sa Barangay Sabang."
                                if any(w in clean_message.lower() for w in ["ang", "ng", "mga", "sa", "paano", "kailan", "po"])
                                else "I apologize, but I cannot assist with this inquiry under our civic safety and community guidelines. Please let me know how I can help you with waste segregation, recycling, or Barangay Sabang schedules."
                            )
                            return ChatQueryResponse(
                                reply=safety_msg,
                                is_from_cache=False,
                                is_fallback=True,
                                model_used="safety-guardrail",
                                citations=[],
                                featured_project=None,
                                suggested_prompts=[
                                    "Kailan ang hakot sa aming Purok?",
                                    "Tamang pagbubukod ng basura (RA 9003)",
                                ],
                            )

                        # Extract grounding search citations if present
                        citations: List[SourceCitation] = []
                        grounding_metadata = candidate.get("groundingMetadata", {})
                        search_chunks = grounding_metadata.get("groundingChunks", [])
                        for chunk in search_chunks:
                            web = chunk.get("web", {})
                            if web.get("uri") and web.get("title"):
                                citations.append(SourceCitation(
                                    title=web.get("title"),
                                    url=web.get("uri")
                                ))

                        # Also detect any Markdown hyperlinks in the generated text
                        if not citations:
                            for m in re.finditer(r'\[([^\]]+)\]\((https?://[^\)]+)\)', reply_text):
                                citations.append(SourceCitation(title=m.group(1), url=m.group(2)))

                        # ONLY trigger default Reference Links when explicitly requested or query has legal/guideline intent
                        if not citations and has_legal_reference_intent(clean_message):
                            citations.append(SourceCitation(
                                title="DENR-EMB Solid Waste Management Portal",
                                url="https://emb.gov.ph/solid-waste-management/",
                                snippet="Official national guidelines for ecological solid waste management (RA 9003)."
                            ))

                        suggested_prompts = [
                            "Paano gumawa ng compost mula sa kitchen scraps?",
                            "Purok pickup schedules for this week",
                            "Paano i-turn ang plastic wrappers sa eco-bricks?",
                        ]

                        response_obj = ChatQueryResponse(
                            reply=reply_text,
                            is_from_cache=False,
                            is_fallback=False,
                            model_used=model_name,
                            citations=citations[:4],
                            featured_project=matched_project,
                            suggested_prompts=suggested_prompts,
                        )

                        _CACHE[cache_key] = (now, response_obj.model_dump())
                        return response_obj
            except Exception as ex:
                logger.warning(f"Gemini API invocation attempt failed: {ex}")
                continue  # Try next key if pool exists

    # 4. Graceful Offline / Quota Fallback (100% Free, Rich Local Knowledge Base)
    logger.info("Executing EcoBot local knowledge & upcycling fallback")
    
    fallback_reply = ""
    citations: List[SourceCitation] = []
    lower_msg = clean_message.lower()
    
    # 4-Slang / Compliments (e.g. werpa, lodi, salamat, thank you)
    if any(k in lower_msg for k in ["werpa", "salamat", "thank you", "thanks", "lodi"]):
        fallback_reply = "Salamat po! How can I help you today?"
        matched_project = None
        citations = []

    # 4-Provocations / Trolling / Insults
    elif any(k in lower_msg for k in ["bading", "pangit", "panget", "bot ka lang", "walang kwenta", "epal"]):
        fallback_reply = "Isang digital civic assistant po ako ng Barangay Sabang. How can I help you today?"
        matched_project = None
        citations = []

    # 4A. Matched Curated Upcycling Project (Only when explicitly requested)
    elif matched_project:
        fallback_reply = (
            f"🌿 Maaari nating i-recycle o gamitin muli ang materyal na ito sa pamamagitan ng **{matched_project.title}**:\n\n"
            f"**Kategorya:** {matched_project.category.replace('_', ' ')} • **Antas:** {matched_project.difficulty}\n"
            f"**Tinatayang Oras:** {matched_project.estimated_time}\n\n"
            f"📦 **Mga Kakailanganing Gamit:**\n"
            + "\n".join(f"• {m}" for m in matched_project.materials_needed)
            + f"\n\n🛠️ **Mga Hakbang sa Paggawa (Step-by-Step):**\n"
            + "\n".join(f"{s.step_number}. **{s.title}:** {s.instruction}" for s in matched_project.steps)
            + f"\n\n🌱 **Bakit ito mahalaga sa Barangay Sabang?**\n{matched_project.benefits}\n\n"
            f"*Paalala: Ang inisyatibong ito ay nakatutulong sa Republic Act 9003 upang mabawasan ang tambak ng basura sa ating pamayanan.*"
        )
        if matched_project.source_url:
            citations.append(SourceCitation(
                title=f"DENR-EMB Upcycling Guidelines ({matched_project.category})",
                url=matched_project.source_url,
                snippet="Environmental Management Bureau Ecological Solid Waste Management guidelines."
            ))

    # 4B. Incident Reporting / Uncollected Trash / Violations
    elif any(k in lower_msg for k in ["report", "sumbong", "reklamo", "tambak", "illegal", "violation", "hindi nahakot", "dumihan", "kalat"]):
        fallback_reply = (
            f"📢 **Paano Mag-ulat ng Basura o Paglabag sa SABTRACK:**\n\n"
            f"Maaari kayong magsumite ng opisyal na incident report nang direkta sa pamamagitan ng **SABTRACK Resident Portal** nang hindi na kailangang pumunta sa Barangay Hall:\n\n"
            f"1. **Buksan ang Incident Reports:** Pumunta sa tab na **'Incident Reports'** sa inyong resident portal at i-click ang **'Report Waste Incident'**.\n"
            f"2. **Mag-attach ng Larawan:** Kumuha o mag-upload ng litrato ng tambak o paglabag. Awtomatikong tinatanggal ng SABTRACK ang EXIF GPS data para sa inyong privacy (RA 10173).\n"
            f"3. **Pumili ng Kategorya:** Piliin kung ito ay *Uncollected Garbage*, *Illegal Dumping*, *Improper Waste Segregation*, o *Hazardous Waste*.\n"
            f"4. **Ilagay ang Lokasyon at I-submit:** Ilagay ang Purok o landmark. Matatanggap ito ng Barangay Sabang Eco-Patrol at makatatanggap kayo ng real-time status updates at email advisory kapag naresolba na ang reklamo.\n\n"
            f"⭐ *Dagdag pa rito, kikita kayo ng mga accredited **SAB-Points** sa bawat beripikadong report na maresolba ng barangay!*\n\nMay maitutulong pa ba ako sa paggamit ng SABTRACK o sa inyong report?"
        )
        if has_legal_reference_intent(lower_msg):
            citations.append(SourceCitation(
                title="SABTRACK Resident Incident Reporting Desk",
                url="https://lipa.gov.ph",
                snippet="Official digital reporting portal for Barangay Sabang Solid Waste Management."
            ))

    # 4C. SAB-Points & Community Civic Rewards
    elif any(k in lower_msg for k in ["points", "sab-points", "reward", "gantimpala", "kumita", "score", "ledger"]):
        fallback_reply = (
            f"🏆 **Paano Kumita at Gamitin ang SAB-Points sa Barangay Sabang:**\n\n"
            f"Ang **SAB-Points** ay ang opisyal na civic engagement rewards system ng SABTRACK upang hikayatin ang aktibong pakikilahok ng mga residente sa kalinisan:\n\n"
            f"**Mga Paraan para Kumita ng Puntos:**\n"
            f"• **Beripikadong Pag-uulat ng Basura (+Points):** Mag-ulat ng uncollected waste o illegal dumping sa Resident Portal na matagumpay na maaksyunan ng barangay.\n"
            f"• **Barangay Clean-Up Drives (+Points):** Lumahok sa mga opisyal na community clean-up, canal clearing, at tree planting activities sa Barangay Sabang.\n"
            f"• **MRF Waste Turnover (+Points):** Magdala ng malilinis na plastic bottles, eco-bricks, at mareresiklong materyales sa Barangay Materials Recovery Facility (MRF).\n\n"
            f"Maaari ninyong masubaybayan ang inyong naipong puntos sa inyong **Resident Dashboard** at i-redeem ang mga ito para sa mga barangay civic incentives at eco-friendly household goods."
        )
        if has_legal_reference_intent(lower_msg):
            citations.append(SourceCitation(
                title="SABTRACK Civic Rewards & Community Engagement Ledger",
                url="https://lipa.gov.ph",
                snippet="Civic points accreditation guidelines for Barangay Sabang solid waste compliance."
            ))

    # 4D. RA 9003 Policies, Penalties & Waste Segregation
    elif any(k in lower_msg for k in ["batas", "ra 9003", "multa", "parusa", "bawal", "segregation", "bukod", "siga", "sunog", "ordinansa"]):
        fallback_reply = (
            f"⚖️ **Alituntunin at Parusa sa Ilalim ng Republic Act No. 9003 (Ecological Solid Waste Management Act):**\n\n"
            f"Ipinatutupad sa buong Barangay Sabang at Lipa City ang mga sumusunod na panuntunan:\n\n"
            f"1. **'No Segregation, No Collection' (Sec. 21):** Mahigpit na ipinagbabawal ang paghahalo ng basura. Hindi hahakutin ng sanitation truck ang mga basurang hindi nakabukod sa green, black, at white bags.\n"
            f"2. **Bawal ang 'Siga' o Pagsusunog ng Basura (Sec. 48, Par. 3):** Mahigpit na ipinagbabawal ang pagsusunog ng dahon, plastik, o anumang basura. May multang **₱300 hanggang ₱1,000**, o pagkakakulong ng 1 hanggang 15 araw, o community service.\n"
            f"3. **Bawal ang Pagtatapon sa Kalsada at Bakanteng Lote (Sec. 48, Par. 1):** Ang pagkakalat o illegal dumping ay may parusang multa na **₱300 hanggang ₱1,000** o 1-15 araw na community service.\n\n"
            f"♻️ **Opisyal na Pagbubukod ng Basura:**\n"
            f"• **Biodegradable (Green Bag):** Tirang pagkain, balat ng gulay at prutas, tuyong dahon.\n"
            f"• **Non-Biodegradable (Black Bag):** Residual plastics, wrappers, sanitary napkins, basahan.\n"
            f"• **Recyclable (White/Clear Bag):** Bote, karton, lata, malinis na plastic containers."
        )
        citations.append(SourceCitation(
            title="Republic Act No. 9003 (Ecological Solid Waste Management Act)",
            url="https://emb.gov.ph/solid-waste-management/",
            snippet="Official provisions, prohibited acts, and penalties under RA 9003."
        ))

    # 4E. Hazardous, Electronic & Special Waste
    elif any(k in lower_msg for k in ["e-waste", "electronic", "appliances", "baterya", "battery", "bumbilya", "hazard", "kemikal", "gamot", "delikado"]):
        fallback_reply = (
            f"⚠️ **Gabay sa Pagtapon ng Electronic at Hazardous Waste (Special Waste):**\n\n"
            f"Ang mga sirang appliances, electronics (e-waste), bumbilya, baterya, at expired na gamot ay **HINDI DAPAT ITAPON** sa regular na basurahan o ilabas sa curbside dahil naglalaman ang mga ito ng nakalalasong kemikal tulad ng lead at mercury.\n\n"
            f"**Tamang Paraan ng Pag-dispose:**\n"
            f"1. **Barangay MRF Drop-off:** Dalhin ang mga sirang electronics, fluorescent bulbs, at baterya sa **Barangay Sabang Materials Recovery Facility (MRF)** para sa ligtas na storage at certified recycling.\n"
            f"2. **Repair at Re-use:** Kung maaari pang maayos, ipagawa sa mga lokal na repair shops sa Lipa City upang mabawasan ang electronic waste.\n"
            f"3. **CENRO Hazardous Waste Collection:** Mag-abang sa mga anunsyo sa SABTRACK para sa regular na special collection drives ng Lipa City CENRO.\n\n"
            f"Maaari rin ninyong iulat sa SABTRACK Incident Reports kung may napansing itinapong hazardous chemicals o sirang appliances sa kalsada."
        )
        citations.append(SourceCitation(
            title="DENR-EMB Hazardous & Special Waste Management Standards",
            url="https://emb.gov.ph/hazardous-waste-management-services/",
            snippet="Safe handling and disposal protocol for toxic, hazardous, and electronic waste."
        ))

    # 4F-1. General Trivia / President Off-Topic Response
    elif any(k in lower_msg for k in ["president", "pangulo"]):
        is_tagalog = any(w in lower_msg for w in ["sino", "ang", "ng", "ba", "po", "natin", "atin"]) or "pangulo" in lower_msg
        if is_tagalog:
            fallback_reply = (
                "Ang kasalukuyang Pangulo ng Pilipinas ay si Pangulong Ferdinand 'Bongbong' Marcos Jr.\n\n"
                "May maitutulong po ba ako tungkol sa waste collection o serbisyo sa ating barangay?"
            )
        else:
            fallback_reply = (
                "The current President of the Philippines is President Ferdinand 'Bongbong' Marcos Jr.\n\n"
                "May I help you with waste collection, schedules, or barangay sanitation concerns?"
            )
        matched_project = None
        citations = []

    # 4F-2. General Trivia / Time Off-Topic Response
    elif any(k in lower_msg for k in ["anong oras", "what time", "oras na"]):
        fallback_reply = (
            "Ang opisyal na oras sa Pilipinas ay nakabase sa Philippine Standard Time (PST).\n\n"
            "May maitutulong po ba ako tungkol sa waste collection o iskedyul ng hakot sa ating barangay?"
        )
        matched_project = None
        citations = []

    # 4F-3. General Trivia / Weather Off-Topic Response
    elif any(k in lower_msg for k in ["weather", "panahon", "uulan", "bagyo"]) and not any(k in lower_msg for k in ["hakot", "basura", "delay"]):
        fallback_reply = (
            "Para sa kasalukuyang lagay ng panahon at anunsyo sa Lipa City, maaaring sumangguni sa opisyal na ulat ng PAGASA.\n\n"
            "May maitutulong po ba ako tungkol sa waste collection o serbisyo sa ating barangay?"
        )
        matched_project = None
        citations = []

    # 4F. Schedules & Collection Days
    elif any(k in lower_msg for k in ["schedule", "hakot", "kailan", "oras", "tapon", "pickup", "today", "araw"]):
        fallback_reply = (
            f"📅 **Opisyal na Iskedyul ng Hakot ng Basura — Barangay Sabang:**\n\n"
            f"{sched_context}\n\n"
            f"♻️ **Alituntunin sa Pagbubukod (RA 9003):**\n"
            f"• **Biodegradable / Nabubulok (Green Bag):** Tirang pagkain, balat ng gulay, tuyong dahon.\n"
            f"• **Non-Biodegradable / Di-Nabubulok (Black Bag):** Residual plastics, sanitary waste, basahan.\n"
            f"• **Recyclable / Mareresiklo (White/Clear Bag):** Bote, karton, lata, malinis na plastic containers.\n\n"
            f"Maaari rin ninyong iulat ang anumang naantalang hakot sa pamamagitan ng SABTRACK Incident Reports desk.\n\nMay kailangan ka pa bang malaman tungkol sa waste segregation o iskedyul sa inyong Purok?"
        )
        if has_legal_reference_intent(lower_msg):
            citations.append(SourceCitation(
                title="Barangay Sabang Solid Waste Management Timetable 2026",
                url="https://lipa.gov.ph",
                snippet="Official approved recurring garbage route schedules for Lipa City."
            ))
    elif is_off_topic:
        fallback_reply = (
            "Ako si EcoBot, ang digital assistant para sa kalinisan at waste management ng Barangay Sabang.\n\n"
            "May maitutulong po ba ako tungkol sa waste collection, iskedyul ng hakot, o serbisyo sa ating barangay?"
        )
        matched_project = None
        citations = []
    else:
        fallback_reply = (
            f"Magandang araw! Ako si **EcoBot**, ang digital solid waste governance assistant ng Barangay Sabang (SABTRACK 3.0).\n\n"
            f"Maaari mo akong tanungin tungkol sa:\n"
            f"1. 💡 **Pag-upcycle ng Basura:** Paano gawing pataba ang balat ng prutas, gumawa ng self-watering planters, o eco-bricks.\n"
            f"2. 🗓️ **Iskedyul ng Hakot:** Alamin kung anong araw ang hakot ng nabubulok o mareresiklo sa inyong Purok.\n"
            f"3. 📢 **Pag-ulat ng Basura (Incident Reports):** Paano magsumite ng reklamo o tambak ng basura gamit ang SABTRACK.\n"
            f"4. 🏆 **SAB-Points:** Paano kumita ng civic points sa pamamagitan ng clean-up drives at MRF turnover.\n"
            f"5. ⚖️ **Republic Act 9003:** Tamang pagbubukod, mga bawal, at kaukulang multa sa ilalim ng batas.\n\n"
            f"Ano ang nais ninyong alamin o iulat ngayon?"
        )

    suggested_prompts = [
        "Paano gumawa ng compost mula sa kitchen scraps?",
        "Self-watering planter mula sa plastic soda bottle",
        "Kailan ang hakot ng basura sa aking Purok?",
    ]

    response_obj = ChatQueryResponse(
        reply=fallback_reply,
        is_from_cache=False,
        is_fallback=True,
        model_used="ecobot-curated-local",
        citations=citations,
        featured_project=matched_project,
        suggested_prompts=suggested_prompts,
    )

    _CACHE[cache_key] = (now, response_obj.model_dump())
    return response_obj
