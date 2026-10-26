# EcoGabay Sabang Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Project:** SABTRACK 3.0 (IT 313 — System Analysis and Design, Batangas State University – The NEU)  
**Client:** Barangay Sabang, Lipa City, Batangas  
**Feature:** EcoGabay Sabang — 100% Free AI Civic & DIY Waste Upcycling Assistant with Web Grounding, Smart Caching, and Offline Fallback.

---

## 1. Architecture & Design Specification

### 1.1 Persona & Identity
- **Name:** **EcoGabay Sabang** (*Sub-caption: "Ang Inyong Gabay sa Kalinisan at Upcycling"*)
- **Role:** 24/7 Citizen Waste Repurposing, Collection Scheduling, and RA 9003 Compliance Assistant.
- **Capabilities:**
  1. **Creative Upcycling & DIY Waste Repurposing:** Answers *"How can I turn waste into something useful?"* by conducting live web searches via Gemini Flash Search Grounding for DIY tutorials (ecobricks, vertical planters, organic composting, eggshell fertilizer).
  2. **Live Barangay Operations:** Provides real-time pickup timetables for Purok 1–7 directly from the SABTRACK PostgreSQL database.
  3. **RA 10173 & Academic Integrity:** Strips all resident PII before external requests; falls back gracefully to a curated local upcycling library when offline or if the 1,500/day free quota is reached.

### 1.2 Proposed File Layout
```text
apps/api/
  app/
    modules/
      chatbot/
        __init__.py
        schemas.py           # ChatQueryRequest, ChatQueryResponse, UpcyclingProject
        upcycling_library.py # Pre-loaded offline DIY projects (plastic, organic, paper, glass)
        service.py           # Caching, Gemini API client, key rotation, DB schedule injection, fallback
    api/v1/endpoints/
      chatbot.py           # POST /api/v1/chatbot/query, GET /api/v1/chatbot/prompts
  tests/
    test_chatbot.py        # Pytest test suite (mocking Gemini, testing fallback, caching, sanitization)

apps/web/
  src/
    components/
      EcoGabayWidget.tsx   # Floating Neumorphic widget, message stream, suggestion chips
    types/
      chatbot.ts           # TypeScript interfaces for chat payloads
  tests/
    EcoGabayWidget.test.tsx # Vitest component suite (open/close, send message, render DIY steps)
```

---

## 2. Step-by-Step Task Decomposition

### Task 1: Backend Data Contracts & Offline Upcycling Knowledge Library
- [ ] Create `apps/api/app/modules/chatbot/schemas.py` with `ChatQueryRequest`, `ChatQueryResponse`, `SourceCitation`, and `QuickPromptItem`.
- [ ] Create `apps/api/app/modules/chatbot/upcycling_library.py` containing structured, verified local upcycling guides (plastic bottles, kitchen scraps, cardboard, used tires, glass containers) with materials, step-by-step instructions, and safety tips.
- [ ] Write initial unit test in `apps/api/tests/test_chatbot.py` asserting schemas serialize and upcycling library items are accessible.

### Task 2: Backend Chatbot Engine with Caching, Database Context & Fallback
- [ ] Implement `apps/api/app/modules/chatbot/service.py`:
  - `query_ecogabay()`: Checks 24-hr in-memory cache first.
  - If question is schedule-related: queries `schedules` and `areas` tables for real Barangay Sabang route information.
  - If `GEMINI_API_KEY` is configured: calls Gemini 1.5 Flash with search grounding for web tutorials.
  - If quota is exceeded (HTTP 429) or no API key is present: automatically activates `upcycling_library.py` fallback with zero downtime.
  - Ensures all resident personal identifiers are stripped prior to external requests (RA 10173).
- [ ] Add endpoint in `apps/api/app/api/v1/endpoints/chatbot.py` (`POST /api/v1/chatbot/query`, `GET /api/v1/chatbot/prompts`).
- [ ] Register router in `apps/api/app/api/v1/api.py`.
- [ ] Add pytest tests in `apps/api/tests/test_chatbot.py` verifying fallback behavior, caching, and schedule query matching. Run `pytest tests/test_chatbot.py`.

### Task 3: Frontend TypeScript Types & API Client Integration
- [ ] Create `apps/web/src/types/chatbot.ts` defining payload contracts.
- [ ] Add `queryEcoGabay(message: string, areaId?: number)` and `getEcoGabayPrompts()` helper functions in `apps/web/src/lib/api-client.ts`.

### Task 4: Neumorphic EcoGabay Floating Widget Component
- [ ] Create `apps/web/src/components/EcoGabayWidget.tsx`:
  - Floating Neumorphic trigger button (`#edf2f7`, emerald icon with subtle pulse indicator, bottom-right).
  - Expandable modal/drawer with header (EcoGabay Sabang avatar, online/web-connected badge, minimize/close).
  - Suggested inquiry chips (e.g. *"Paano gawing pataba ang balat ng gulay?"*, *"Eco-brick plastic bottle tutorial"*, *"Kailan hakot sa Purok 2?"*).
  - Message bubble list with markdown formatting, bullet points, and source citations.
  - Sunken Neumorphic input (`.neu-input`) and glowing green send button (`.neu-btn-primary`).
- [ ] Mount `<EcoGabayWidget />` in `apps/web/src/app/layout.tsx` so it is accessible across landing and portal pages.

### Task 5: Automated Testing & Verification
- [ ] Create Vitest test in `apps/web/tests/EcoGabayWidget.test.tsx` verifying:
  - Widget toggle opens and closes drawer.
  - Displays quick suggestion chips.
  - Submits user question and renders assistant response with DIY steps.
- [ ] Run full test suites:
  - `npm test` in `apps/web` (maintain 100% passing across all 16 test files).
  - `pytest tests` in `apps/api` (maintain 100% passing across all 60 tests).
- [ ] Verify live endpoints on `http://localhost:3000/`.
