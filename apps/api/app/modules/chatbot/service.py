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

def scrub_pii(text: str) -> str:
    """Strip personal identifiers (emails, phone numbers) to comply with RA 10173."""
    # Scrub email addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[REDACTED_EMAIL]', text)
    # Scrub PH phone numbers (+639xxxxxxxxx or 09xxxxxxxxx)
    text = re.sub(r'(\+?63|0)9\d{9}', '[REDACTED_PHONE]', text)
    return text

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
                    "You are EcoBot (or 'Eco'), the friendly, conversational civic assistant for Barangay Sabang, Lipa City, Batangas.\n\n"
                    "RESPONSE GUIDELINES:\n"
                    "1. SHORT, CLEAR & CONCISE: Keep answers direct, friendly, and easy to read (1-3 short paragraphs or 2-4 bullet points max). Avoid overwhelming users with long essays or unsolicited manuals.\n"
                    "2. NATURAL & CONVERSATIONAL: Speak warmly in natural Tagalog, English, or Taglish (e.g. 'Kumusta, Ka-Sabang!', 'Mabilisang sagot: ...'). Sound like a helpful neighbor or barangay desk officer.\n"
                    "3. CONTEXT & INTENT AWARENESS: Understand incomplete queries, short phrases, or follow-up questions from the conversation history (e.g. if previous messages discuss plastic bottles, and the user asks 'paano gawin?' or 'kailan?', seamlessly infer their intent without asking them to repeat themselves).\n"
                    "4. PROGRESSIVE DISCLOSURE: Give the core answer first. If there are many detailed steps, summarize the key idea in 1-2 sentences and invite: 'Gusto mo bang malaman ang kumpletong hakbang?' or 'Sabihin mo lang kung nais mo ng buong gabay.'\n"
                    "5. OFFICIAL BARANGAY SABANG SCHEDULES ON RECORD:\n"
                    f"{sched_context}\n"
                    "Answer Purok collection inquiries accurately from the record above. Encourage source segregation (Biodegradables in green bags, Non-bio in black bags, Recyclables in white/clear bags).\n"
                    "6. CITATIONS: Use concise markdown links [Source Name](url) when citing official government guidelines or reputable portals."
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
                        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 350}
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
                        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 350}
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

                        # Attach official DENR reference if none was parsed
                        if not citations:
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

    # 4. Graceful Offline / Quota Fallback (100% Free & Resilient)
    logger.info("Executing EcoBot local knowledge & upcycling fallback")
    
    fallback_reply = ""
    citations: List[SourceCitation] = []
    
    # Check if inquiry matches upcycling / repurposing
    if matched_project:
        fallback_reply = (
            f"🌿 **Magandang balita!** Maaari nating gawing kapaki-pakinabang ang inyong basura sa pamamagitan ng **{matched_project.title}**!\n\n"
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
    elif any(k in clean_message.lower() for k in ["schedule", "hakot", "kailan", "oras", "tapon", "pickup", "today", "araw"]):
        fallback_reply = (
            f"📅 **Opisyal na Iskedyul ng Hakot ng Basura — Barangay Sabang:**\n\n"
            f"{sched_context}\n\n"
            f"♻️ **Alituntunin sa Pagbubukod (RA 9003):**\n"
            f"• **Biodegradable / Nabubulok (Green Bag):** Tirang pagkain, balat ng gulay, tuyong dahon.\n"
            f"• **Non-Biodegradable / Di-Nabubulok (Black Bag):** Residual plastics, sanitary waste, basahan.\n"
            f"• **Recyclable / Mareresiklo (White/Clear Bag):** Bote, karton, lata, malinis na plastic containers.\n\n"
            f"Maaari rin ninyong iulat ang anumang naantalang hakot sa pamamagitan ng SABTRACK Incident Reports desk!"
        )
        citations.append(SourceCitation(
            title="Barangay Sabang Solid Waste Management Timetable 2026",
            url="https://lipa.gov.ph",
            snippet="Official approved recurring garbage route schedules for Lipa City."
        ))
    else:
        fallback_reply = (
            f"Mabuhay! Ako si **EcoBot**, ang digital assistant at upcycling guide ng Barangay Sabang.\n\n"
            f"Maaari mo akong tanungin tungkol sa:\n"
            f"1. 💡 **Pag-upcycle ng Basura:** Paano gawing pataba ang balat ng prutas, gumawa ng self-watering planters, o eco-bricks.\n"
            f"2. 🗓️ **Iskedyul ng Hakot:** Alamin kung anong araw ang hakot ng nabubulok o mareresiklo sa inyong Purok.\n"
            f"3. ⚖️ **Republic Act 9003:** Tamang pagbubukod (biodegradable, non-biodegradable, recyclable).\n"
            f"4. 🏆 **SAB-Points:** Paano kumita ng civic points sa pamamagitan ng clean-up drives at MRF turnover.\n\n"
            f"Ano ang nais ninyong alamin o gawing proyekto ngayon?"
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
