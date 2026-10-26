# Real-Time Automatic Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement true real-time automatic synchronization across all citizen and administrative portals in SABTRACK 3.0 so reports, status transitions, announcements, and claims update instantaneously without manual page refreshes.

**Architecture:** A lightweight FastAPI WebSocket hub (`/api/v1/ws`) with an in-memory `ConnectionManager` broadcasting real-time mutation events (`REPORT_CREATED`, `REPORT_STATUS_CHANGED`, `ANNOUNCEMENT_PUBLISHED`, `CLAIM_SUBMITTED`, `CLAIM_REVIEWED`), paired with a Next.js `useRealtimeSync` hook that listens via WebSocket and re-fetches portal state with zero delay, supplemented by visibility change and tab-focus auto-sync.

**Tech Stack:** FastAPI WebSockets, Starlette, Python 3.13, Next.js 16, React 19, TypeScript.

---

### Task 1: Backend WebSocket Connection Manager & Broadcast Hub

**Files:**
- Create: `apps/api/app/core/websocket.py`
- Create: `apps/api/app/api/v1/endpoints/realtime.py`
- Modify: `apps/api/app/api/v1/router.py`
- Create: `apps/api/tests/test_realtime_websocket.py`

- [ ] **Step 1: Create `apps/api/app/core/websocket.py` with `ConnectionManager` for tracking active client WebSockets and broadcasting JSON messages**
- [ ] **Step 2: Create `apps/api/app/api/v1/endpoints/realtime.py` with `@router.websocket("/ws")`**
- [ ] **Step 3: Register realtime router in `apps/api/app/api/v1/router.py`**
- [ ] **Step 4: Write integration test in `apps/api/tests/test_realtime_websocket.py` verifying WebSocket handshake and broadcast receipt**
- [ ] **Step 5: Run pytest to verify WebSocket tests pass**
- [ ] **Step 6: Commit Task 1 changes**

---

### Task 2: Broadcast Event Hooks on State Mutations

**Files:**
- Modify: `apps/api/app/api/v1/endpoints/reports.py`
- Modify: `apps/api/app/api/v1/endpoints/announcements.py`
- Modify: `apps/api/app/api/v1/endpoints/schedules.py`
- Modify: `apps/api/app/api/v1/endpoints/gamification.py`

- [ ] **Step 1: Broadcast `REPORT_CREATED` and `REPORT_STATUS_CHANGED` in `reports.py`**
- [ ] **Step 2: Broadcast `ANNOUNCEMENT_PUBLISHED` and `ANNOUNCEMENT_DEACTIVATED` in `announcements.py`**
- [ ] **Step 3: Broadcast `SCHEDULE_CREATED` and `ADVISORY_BROADCAST` in `schedules.py`**
- [ ] **Step 4: Broadcast `CLAIM_SUBMITTED` and `CLAIM_REVIEWED` in `gamification.py`**
- [ ] **Step 5: Run Pytest test suite to ensure existing endpoints still pass without regressions**
- [ ] **Step 6: Commit Task 2 changes**

---

### Task 3: Frontend Real-Time Hook & Portal Integration

**Files:**
- Create: `apps/web/src/lib/use-realtime-sync.ts`
- Modify: `apps/web/src/app/resident/reports/page.tsx`
- Modify: `apps/web/src/app/admin/reports/page.tsx`
- Modify: `apps/web/src/app/resident/announcements/page.tsx`
- Modify: `apps/web/src/app/admin/announcements/page.tsx`
- Modify: `apps/web/src/app/resident/page.tsx`
- Modify: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/tests/RealtimeSync.test.tsx`

- [ ] **Step 1: Implement `useRealtimeSync` hook with WebSocket connection, auto-reconnect, visibilitychange trigger, and background heartbeat**
- [ ] **Step 2: Write Vitest test in `apps/web/tests/RealtimeSync.test.tsx`**
- [ ] **Step 3: Run Vitest tests to verify hook behavior**
- [ ] **Step 4: Integrate `useRealtimeSync` into Resident Reports & Admin Reports pages**
- [ ] **Step 5: Integrate `useRealtimeSync` into Announcements & Dashboards**
- [ ] **Step 6: Run `npm test` and `npm run build`**
- [ ] **Step 7: Commit Task 3 changes**
