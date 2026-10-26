# Modern, Minimal, and People-Friendly Green UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the SABTRACK 3.0 interface into a modern, minimal, and people-friendly civic green design with a calming pale sage canvas (`#f4f8f5`), crisp white cards (`#ffffff`), delicate micro-shadows, accessible typography, and unified components, while preserving 100% of existing functionality, backend logic, RBAC, and passing tests.

**Architecture:** Token-first cascade. Foundation tokens in `globals.css` and `tailwind.config.ts` are updated first to propagate refined neumorphic shadows, white surfaces, and civic green ramps. Next, layout shells (`RootLayout`, `Header`, `Footer`, `ResidentLayout`, `AdminLayout`) are refined, followed by public/auth pages, resident and admin dashboards, and widgets (`EcoBotWidget`, `StatusCard`, `ImageUpload`).

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 3.4, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-26-modern-minimal-green-ui-redesign.md`

## Global Constraints

- **Canvas Background:** `#f4f8f5` (calming pale sage tint)
- **Surface / Card Background:** `#ffffff` (crisp pure white)
- **Civic Greens:** Primary `#0F5132` (Civic Forest), Hover `#0b3d26`, Accent `#198754` (Emerald), Soft Tint `#e8f5ec` (Mint)
- **Typography:** Slate 900 (`#0f172a`) / Slate 800 (`#1e293b`) for headings and body; Slate 600 (`#475569`) / Slate 500 (`#64748b`) for helper text
- **Preservation:** Never modify backend logic, API endpoints, RBAC permissions, ARIA labels, form field names, or test attributes (`data-testid`, links, buttons)
- **Zero Regressions Floor:** All 70 Vitest unit/component tests in `apps/web` must remain green

## Review Focus

1. **Test-Required Text & Selectors:** Component tests assert specific text content (e.g. "HOME", "ABOUT", "CONTACT US", "LOGIN", "Resident Portal", role badges). These exact strings and link destinations must never be altered.
2. **Contrast & Readability on Pale Sage:** Ensure text placed directly on the `#f4f8f5` canvas or `#ffffff` cards meets WCAG AA (4.5:1 for body text, 3:1 for large headings).
3. **Mobile Viewport Overflow:** Cards, modals, tables, and nav headers must not cause horizontal scrolling on 375px screens.
4. **Input Focus & Error Visibility:** Inset inputs (`.neu-input`) must display clear forest green focus rings and high-contrast red error alerts when invalid.
5. **Interactive Touch Targets:** Navigation icons, hamburger buttons, and floating EcoBot triggers must maintain at least 44x44px clickable target areas.

---

### Task 1: Design Tokens & Base Surfaces

**Files:**
- Modify: `apps/web/src/app/globals.css:5-165`
- Modify: `apps/web/tailwind.config.ts:10-44`
- Modify: `apps/web/src/app/layout.tsx:18-33`
- Test: `apps/web/tests/Footer.test.tsx` (baseline test)

**Interfaces:**
- Consumes: Tailwind CSS base configuration
- Produces: Refined CSS custom variables (`--background: #f4f8f5`, `--card: #ffffff`), updated `.neu-card`, `.neu-surface`, `.neu-input`, `.neu-btn-primary`, `.neu-btn-secondary`, `.neu-chip-green`, `.neu-socket-green`, and `tailwind.config.ts` shadow tokens.

- [ ] **Step 1: Update CSS Custom Properties in `globals.css`**
  - Change `--background` to `#f4f8f5`
  - Change `--card` to `#ffffff`
  - Change `--border` to `#e2e8f0`
  - Change `--muted` to `#e8ede9`
  - Change `--primary` to `#0F5132`
  - Change `--accent` to `#198754`
  - Update focus ring outline to `#0F5132`

- [ ] **Step 2: Update Neumorphic Utility Classes in `globals.css`**
  - `.neu-surface` & `.neu-card`: background `#ffffff`, border `1px solid rgba(226, 232, 240, 0.75)`, shadow `3px 3px 10px rgba(148, 163, 184, 0.16), -3px -3px 10px rgba(255, 255, 255, 0.95)`, `border-radius: 1rem`
  - `.neu-card-interactive`: hover `box-shadow: 4px 4px 14px rgba(148, 163, 184, 0.22), -4px -4px 14px rgba(255, 255, 255, 1); transform: translateY(-2px)`
  - `.neu-input` & `.neu-select`: background `#f8faf8`, border `1px solid rgba(203, 213, 225, 0.7)`, shadow `inset 2px 2px 4px rgba(148, 163, 184, 0.14), inset -2px -2px 4px rgba(255, 255, 255, 0.85)`
  - `.neu-btn-primary`: background `#0F5132`, shadow `0 4px 12px rgba(15, 81, 50, 0.25)`, hover `#0b3d26`
  - `.neu-btn-secondary`: background `#ffffff`, border `1px solid rgba(203, 213, 225, 0.7)`, shadow `2px 2px 6px rgba(148, 163, 184, 0.14), -2px -2px 6px rgba(255, 255, 255, 0.9)`
  - `.neu-card-convex`: background `linear-gradient(145deg, #ffffff, #f7faf8)`, shadow `4px 4px 12px rgba(148, 163, 184, 0.18), -4px -4px 12px rgba(255, 255, 255, 0.95)`
  - `.neu-chip-green`: background `#e8f5ec`, border `1px solid rgba(25, 135, 84, 0.2)`, color `#0F5132`
  - `.neu-socket-green`: background `#e8f5ec`, shadow `inset 2px 2px 4px rgba(100, 145, 120, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.9)`
  - `.neu-modal`: background `#ffffff`, shadow `10px 10px 24px rgba(148, 163, 184, 0.25), -10px -10px 24px rgba(255, 255, 255, 0.95)`

- [ ] **Step 3: Update `tailwind.config.ts` Palette and Shadow Tokens**
  - Set `civic.sand` to `#f4f8f5`
  - Set `civic.card` to `#ffffff`
  - Refine `boxShadow` definitions (`neu-flat`, `neu-raised`, `neu-raised-lg`, `neu-raised-hover`, `neu-sm`, `neu-xs`, `neu-sunken`, `neu-green`) to use softer slate-opacity (`rgba(148, 163, 184, 0.16–0.25)`)

- [ ] **Step 4: Update `RootLayout` in `layout.tsx`**
  - Update `body` className: `min-h-screen flex flex-col bg-civic-sand text-slate-800 antialiased`

- [ ] **Step 5: Run Vitest to verify baseline tests pass**
  - Run: `Set-Location apps/web; npx vitest run tests/Footer.test.tsx`
  - Expected: PASS

---

### Task 2: Layout Shells & Navigation (`Header`, `Footer`, `ResidentLayout`, `AdminLayout`)

**Files:**
- Modify: `apps/web/src/components/Header.tsx:80-160`
- Modify: `apps/web/src/components/Footer.tsx:7-80`
- Modify: `apps/web/src/app/resident/layout.tsx:47-150`
- Modify: `apps/web/src/app/admin/layout.tsx:80-210`
- Test: `apps/web/tests/Header.test.tsx`
- Test: `apps/web/tests/ResidentLayout.test.tsx`
- Test: `apps/web/tests/AdminLayout.test.tsx`

**Interfaces:**
- Consumes: Auth context (`useAuth`), updated `.neu-*` classes, Lucide icons
- Produces: Polished top header with blurred sage-white background, responsive navigation drawer, dark civic emerald footer, and clean white sidebar layouts for resident and admin portals.

- [ ] **Step 1: Refine `Header.tsx`**
  - Header wrapper: `sticky top-0 z-50 bg-[#f4f8f5]/90 backdrop-blur-md border-b border-slate-200/60 shadow-neu-xs`
  - Brand logo: keep icon and label intact, refine SABTRACK text to `text-slate-900 font-black`, refine `3.0` chip to `bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60`
  - Desktop nav links: clean pill styling with smooth hover transitions (`hover:text-civic-forest hover:bg-emerald-50/60 rounded-xl px-3 py-2`)
  - User greeting & logout: clean white card chips with soft shadows
  - Mobile menu drawer: crisp white container (`bg-white border-b border-slate-200/70 shadow-neu-sm`)

- [ ] **Step 2: Refine `Footer.tsx`**
  - Maintain dark civic forest palette (`bg-gradient-to-b from-[#0a3822] via-[#072919] to-[#041a10]`)
  - Soften background glow accents to delicate emerald/teal blur
  - Increase text contrast (`text-emerald-100/90`, `text-emerald-200/80`)
  - Clean card borders (`border-emerald-500/20`)

- [ ] **Step 3: Refine `ResidentLayout.tsx`**
  - Mobile header bar: change background from `#edf2f7` to `bg-white border-b border-slate-200/70 shadow-neu-xs`
  - Desktop sidebar: crisp white container (`bg-white rounded-2xl border border-slate-200/70 shadow-neu-sm p-4`)
  - Active nav item: `bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80`
  - Inactive nav item: `text-slate-600 hover:text-civic-forest hover:bg-emerald-50/40 rounded-xl`

- [ ] **Step 4: Refine `AdminLayout.tsx`**
  - Mobile header bar: change background to `bg-white border-b border-slate-200/70 shadow-neu-xs`
  - Desktop sidebar: crisp white container (`bg-white rounded-2xl border border-slate-200/70 shadow-neu-sm p-4`)
  - Active nav item: `bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80`
  - Role badges & "View Only" chips: clean soft-amber / soft-mint chips

- [ ] **Step 5: Run Layout Vitest Suites**
  - Run: `Set-Location apps/web; npx vitest run tests/Header.test.tsx tests/ResidentLayout.test.tsx tests/AdminLayout.test.tsx`
  - Expected: ALL PASS

---

### Task 3: Public Landing Page & Auth Flow (`page.tsx`, `login`, `register`)

**Files:**
- Modify: `apps/web/src/app/page.tsx:43-540`
- Modify: `apps/web/src/app/login/page.tsx:60-205`
- Modify: `apps/web/src/app/register/page.tsx:75-290`
- Test: `apps/web/tests/RegisterPage.test.tsx`

**Interfaces:**
- Consumes: Updated neumorphic utility classes, auth hooks, API client registration/login
- Produces: Polished landing page with floating white cards, modern civic badges, and clean auth interfaces with crisp inset inputs.

- [ ] **Step 1: Refine Landing Page (`page.tsx`)**
  - Hero container: `neu-card-convex rounded-3xl p-6 sm:p-10 lg:p-14 relative overflow-hidden border border-slate-200/70 shadow-neu-raised`
  - Badges: `neu-chip-green px-4 py-1.5 rounded-full text-xs font-bold text-civic-forest`
  - Feature & About cards: crisp white card surfaces (`bg-white border border-slate-200/70 rounded-2xl shadow-neu-sm p-6`)
  - Core service cards (Schedule, Violation Reporting, SAB-Points, EcoBot): clean hover elevation (`neu-card-interactive`)
  - Contact Us form: clean white card with refined `.neu-input` fields and accessible submit button
  - Ensure all headings use `text-slate-900 font-black` and body text uses `text-slate-600 font-medium`

- [ ] **Step 2: Refine Login Page (`login/page.tsx`)**
  - Main login container: `bg-white rounded-3xl border border-slate-200/70 shadow-neu-raised p-8 sm:p-10`
  - Header badge: refined green civic chip with lock icon
  - Inputs (Email & Password): `.neu-input` with crisp placeholder text (`placeholder:text-slate-400`)
  - Demo Account Presets: clean white chips with subtle borders (`hover:border-emerald-300 hover:bg-emerald-50/50`)
  - Primary button: `.neu-btn-primary` with civic green gradient and smooth hover

- [ ] **Step 3: Refine Registration Page (`register/page.tsx`)**
  - Main registration card: `bg-white rounded-3xl border border-slate-200/70 shadow-neu-raised p-8 sm:p-10`
  - Form fields: Full Name, Resident ID, Email, Password, Confirm Password, Purok select all styled with `.neu-input` and `.neu-select`
  - Data Privacy consent box: `bg-emerald-50/50 border border-emerald-200/70 rounded-2xl p-4` with accessible checkbox
  - Preserve exact field names, uppercase transformations, and validation states

- [ ] **Step 4: Run Registration Vitest Suite**
  - Run: `Set-Location apps/web; npx vitest run tests/RegisterPage.test.tsx`
  - Expected: ALL PASS

---

### Task 4: Resident Portal & Admin Dashboard (`resident/page.tsx`, `admin/page.tsx`, `StatusCard`)

**Files:**
- Modify: `apps/web/src/components/StatusCard.tsx:49-90`
- Modify: `apps/web/src/app/resident/page.tsx:75-455`
- Modify: `apps/web/src/app/admin/page.tsx:75-375`
- Test: `apps/web/tests/AdminSchedules.test.tsx`
- Test: `apps/web/tests/UsersPage.test.tsx`

**Interfaces:**
- Consumes: Real-time sync hook (`useRealtimeSync`), API client data, StatusCard component
- Produces: Polished metric KPI cards, clean triage list views, and responsive table views with high-contrast text.

- [ ] **Step 1: Refine `StatusCard.tsx`**
  - Container: `neu-card rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-neu-sm hover:shadow-neu-raised transition-all`
  - Refine online/offline/degraded/neutral status styles to use clean soft badge chips with readable text contrast
  - Metric value: `text-2xl sm:text-3xl font-black text-slate-900`
  - Subtext: `text-xs text-slate-500 font-medium`

- [ ] **Step 2: Refine Resident Dashboard (`resident/page.tsx`)**
  - Welcome Banner: floating white card with soft emerald gradient accent, crisp typography, and "Report Waste" CTA
  - Quick Metric Cards: Points Balance, Active Reports, Upcoming Collection in clean white `.neu-card` containers
  - Recent Reports section: clean white card with refined status badges (`bg-rose-50 text-rose-700`, `bg-amber-50 text-amber-700`, `bg-emerald-50 text-emerald-700`)
  - Advisories and Announcements: clean card list with calendar/bell icons

- [ ] **Step 3: Refine Admin Dashboard (`admin/page.tsx`)**
  - Welcome Banner & Refresh button: clean white card with subtle sage border
  - Operational Metrics Grid: floating white cards with clear category counts
  - Urgent Triage Reports Table/Cards: clean white table with `bg-slate-50` headers, `border-b border-slate-100`, readable citizen report details, and quick review buttons

- [ ] **Step 4: Run Admin & Users Vitest Suites**
  - Run: `Set-Location apps/web; npx vitest run tests/AdminSchedules.test.tsx tests/UsersPage.test.tsx`
  - Expected: ALL PASS

---

### Task 5: EcoBot Widget & Common Interactive Components

**Files:**
- Modify: `apps/web/src/components/EcoBotWidget.tsx:90-630`
- Modify: `apps/web/src/components/ImageUpload.tsx:40-140`
- Modify: `apps/web/src/components/HealthDashboard.tsx:30-150`
- Test: `apps/web/tests/EcoBotWidget.test.tsx`
- Test: `apps/web/tests/ImageUpload.test.tsx`
- Test: `apps/web/tests/HealthDashboard.test.tsx`

**Interfaces:**
- Consumes: EcoBot API client (`queryEcoBot`, `getEcoBotPrompts`), ImageUpload file handler, Health check API
- Produces: Polished interactive floating AI assistant, clean file upload dropzone, and responsive service health indicators.

- [ ] **Step 1: Refine `EcoBotWidget.tsx`**
  - Floating Trigger Button: `neu-btn-primary rounded-full p-3.5 shadow-neu-green flex items-center space-x-2 text-white font-bold`
  - Chat Window Shell: `bg-white rounded-3xl border border-slate-200/80 shadow-neu-raised-lg overflow-hidden flex flex-col`
  - Header: `bg-gradient-to-r from-civic-forest to-emerald-700 text-white p-4 flex items-center justify-between`
  - Chat Bubble Styling:
    - User message: `bg-civic-forest text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-sm`
    - Bot message: `bg-emerald-50/70 border border-emerald-200/60 text-slate-800 rounded-2xl rounded-tl-xs px-4 py-2.5 shadow-sm`
  - Quick Prompts: `neu-chip-green text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors`
  - Input area: `.neu-input rounded-2xl` with civic forest send button

- [ ] **Step 2: Refine `ImageUpload.tsx`**
  - Dropzone container: `neu-socket rounded-2xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/30 p-6 text-center hover:bg-emerald-50/60 transition-colors`
  - File preview: crisp rounded card with delete badge and upload progress

- [ ] **Step 3: Refine `HealthDashboard.tsx`**
  - Status gauges and service uptime cards in crisp white containers with refined green/amber/rose indicator dots

- [ ] **Step 4: Run Component Vitest Suites**
  - Run: `Set-Location apps/web; npx vitest run tests/EcoBotWidget.test.tsx tests/ImageUpload.test.tsx tests/HealthDashboard.test.tsx`
  - Expected: ALL PASS

---

### Task 6: Full Verification & Automated Regression Suite

**Files:**
- Verification only: all modified files across `apps/web`
- Test: all 19 test files in `apps/web/tests`

**Interfaces:**
- Consumes: Complete updated web application
- Produces: Verified production build and 100% test pass confirmation.

- [ ] **Step 1: Execute complete Vitest suite**
  - Run: `Set-Location apps/web; npx vitest run`
  - Expected: 19 test files passed, 70 tests passed (0 failures)

- [ ] **Step 2: Execute Next.js production build**
  - Run: `Set-Location apps/web; npx next build`
  - Expected: Exit code 0, successful production compilation without TypeScript or CSS errors

- [ ] **Step 3: Commit all changes with clear academic Git commit message**
  - Command: `git add apps/web docs/superpowers/plans/ docs/superpowers/specs/ && git commit -m "feat(ui): modernize UI with minimal soft sage and white neumorphism"`
