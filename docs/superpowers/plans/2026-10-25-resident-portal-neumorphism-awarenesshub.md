# Resident Portal Neumorphic Redesign & AwarenessHub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Resident Portal of SABTRACK 3.0 into a unified, high-polish civic experience styled with Neumorphic (Soft UI) design patterns. The portal navigation contains the full 7 resident services:
1. **Dashboard** (`/resident`)
2. **Collection Schedules** (`/resident/schedules`)
3. **My Reports** (`/resident/reports`)
4. **SAB-Points** (`/resident/points`)
5. **Announcements** (`/resident/announcements`)
6. **AwarenessHub** (`/resident/awareness` — dedicated multimedia educational hub with video tutorials, Sustainable Development/SDGs, and interactive waste segregation cheat sheets)
7. **Profile** (`/resident/profile`)

**Design Standard:** Neumorphism / Soft-UI based on `ui-ux-pro-max` guidelines:
- Soft raised surface cards (`shadow-soft-raised`: `-4px -4px 12px rgba(255, 255, 255, 0.9), 4px 4px 14px rgba(15, 81, 50, 0.08)`)
- Tactile pressed/debossed interaction states (`shadow-soft-pressed`: `inset -2px -2px 6px rgba(255, 255, 255, 0.8), inset 2px 2px 6px rgba(15, 81, 50, 0.1)`)
- Eco-palette accents (Civic Forest `#0F5132`, Emerald `#198754`, Mint pastel `#E8F5E9`)
- Strict WCAG 2.2 AA contrast compliance (>= 4.5:1 text contrast) and visible 2px keyboard focus outlines.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Vitest, Testing Library.

---

### Task 1: Neumorphic Design Tokens & Shared Portal Layout

**Files:**
- Modify: `apps/web/src/app/globals.css` (add Neumorphic utility classes and shadow tokens)
- Modify: `apps/web/src/app/resident/layout.tsx` (configure the 7 navigation items: Dashboard, Collection Schedules, My Reports, SAB-Points, Announcements, AwarenessHub, Profile)
- Create: `apps/web/tests/ResidentLayout.test.tsx` (verify all 7 navigation links and accessibility attributes)

- [x] **Step 1: Add Neumorphic utility tokens in `apps/web/src/app/globals.css` (`.shadow-soft-raised`, `.shadow-soft-raised-lg`, `.shadow-soft-pressed`, `.shadow-soft-inset`, `.bg-soft-canvas`)**
- [x] **Step 2: Update `apps/web/src/app/resident/layout.tsx` with all 7 items, icons, and routes, styled with soft-raised sidebar navigation**
- [x] **Step 3: Write test in `apps/web/tests/ResidentLayout.test.tsx` verifying all 7 links render with correct `href` and accessible roles**
- [x] **Step 4: Run Vitest to verify `ResidentLayout.test.tsx` passes**
- [x] **Step 5: Commit Task 1 changes**

---

### Task 2: Dedicated Multimedia AwarenessHub Module

**Files:**
- Create: `apps/web/src/app/resident/awareness/page.tsx`
- Create: `apps/web/tests/AwarenessHub.test.tsx`

- [x] **Step 1: Implement `apps/web/src/app/resident/awareness/page.tsx` with:**
  - Topic category filter tabs (`All Topics`, `Waste Segregation`, `Sustainable Development`, `Video Masterclasses`, `Composting & Zero Waste`)
  - Featured Video Player section with responsive embed container and modal playback for waste tutorials
  - Sustainable Development (UN SDGs 11 & 12) & RA 9003 Ecological Solid Waste Management educational cards
  - Interactive tactile Segregation Matrix (Biodegradable, Recyclable, Residual, Special Hazardous)
  - Backyard Composting quick-guide with Do's and Don'ts
  - Full Neumorphic card styling (`shadow-soft-raised`, rounded-2xl, soft pastel accents)
- [x] **Step 2: Write tests in `apps/web/tests/AwarenessHub.test.tsx` asserting topic filtering, video cards, and educational content sections render properly**
- [x] **Step 3: Run Vitest to verify `AwarenessHub.test.tsx` passes**
- [x] **Step 4: Commit Task 2 changes**

---

### Task 3: Resident Dashboard Neumorphic Polish & Quick Links

**Files:**
- Modify: `apps/web/src/app/resident/page.tsx`

- [x] **Step 1: Update Dashboard cards in `apps/web/src/app/resident/page.tsx` to use Neumorphic soft-raised surfaces and tactile quick-action cards**
- [x] **Step 2: Add dedicated quick-action card for AwarenessHub alongside Collection Schedules, My Reports, SAB-Points, and Announcements**
- [x] **Step 3: Maintain existing real-time auto-synchronization (`useRealtimeSync`) and live data metrics**
- [x] **Step 4: Run Vitest to ensure no component regressions**
- [x] **Step 5: Commit Task 3 changes**

---

### Task 4: Module Elevation Polish & Verification

**Files:**
- Modify: `apps/web/src/app/resident/schedules/page.tsx` (Neumorphic styling)
- Modify: `apps/web/src/app/resident/reports/page.tsx` (Neumorphic styling)
- Modify: `apps/web/src/app/resident/points/page.tsx` (Neumorphic styling)
- Modify: `apps/web/src/app/resident/announcements/page.tsx` (Neumorphic styling)

- [x] **Step 1: Apply Neumorphic soft-raised elevations to `schedules/page.tsx`**
- [x] **Step 2: Apply Neumorphic soft-raised elevations to `reports/page.tsx`**
- [x] **Step 3: Apply Neumorphic soft-raised elevations to `points/page.tsx`**
- [x] **Step 4: Apply Neumorphic soft-raised elevations to `announcements/page.tsx`**
- [x] **Step 5: Run full Vitest suite to verify all web tests pass**
- [x] **Step 6: Run frontend build check (`npm run build`) to ensure zero TypeScript/lint compilation errors**
- [x] **Step 7: Commit Task 4 changes**
