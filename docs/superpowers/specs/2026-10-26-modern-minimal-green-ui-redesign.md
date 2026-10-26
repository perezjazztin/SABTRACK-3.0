# Design Specification: Modern, Minimal, and People-Friendly Green UI Redesign

**Project:** SABTRACK 3.0  
**Academic Context:** IT 313 — System Analysis and Design, Batangas State University – The NEU, Lipa Campus  
**Client:** Barangay Sabang, Lipa City, Batangas  
**Proponents:** Jazztin H. Perez, Faith A. Valencia, May Sigrid M. Dimaano  
**Date:** October 26, 2026  
**Status:** PROPOSED (Pending Review & Approval)

---

## 1. Intent and Academic Purpose

SABTRACK 3.0 is a digital governance platform designed for automated garbage collection scheduling, community waste violation reporting, and gamified solid waste stewardship for Barangay Sabang, Lipa City.

The purpose of this design specification is to elevate the platform's visual design to a **modern, minimal, and people-friendly civic green design** that enhances accessibility and citizen usability while retaining the tactile neumorphic identity of the system.

### Core Problems Addressed:
1. **Visual Heaviness & Muddy Surfaces:** The original neumorphic implementation relied on dark slate-gray canvases (`#edf2f7`) and heavy gray-blue shadows (`rgba(163, 177, 198, 0.35–0.5)`), which created a slightly dingy, fatigued visual tone.
2. **Typography & Readability:** Low-contrast helper labels and dense padding in certain cards occasionally reduced clarity for barangay residents using mobile devices under sunlight.
3. **Palette Harmony:** Strong, saturated green tones needed to be balanced with calming soft sage, crisp white card surfaces, and gentle mint badges to feel welcoming, civic-minded, and easy on the eyes.

---

## 2. Goals, Non-Goals, and Anti-Goals

### 2.1 Goals
- **Calming Sage & Crisp White Architecture:** Implement a very faint, soothing sage-tinted background canvas (`#f4f8f5`) with floating crisp white (`#ffffff`) neumorphic cards.
- **Refined Soft-Neumorphic Shadows:** Replace heavy, dark shadows with delicate, diffused micro-shadows (e.g., `3px 3px 10px rgba(148, 163, 184, 0.18)` paired with pure white negative bevel highlights `-3px -3px 10px rgba(255, 255, 255, 0.95)`).
- **People-Friendly Green Palette:** Anchor primary interactions with Civic Forest (`#0F5132`) and Emerald (`#198754`), complemented by soft sage backgrounds, mint sockets, and high-contrast slate text (`#0f172a` and `#1e293b`).
- **Unified Component System:** Standardize buttons, cards, inputs, selects, status badges, modals, and navigation drawers across the Landing Page, Login, Register, Resident Portal, Admin Dashboard, and EcoBot widget.
- **Full Responsiveness:** Ensure polished spacing and touch targets across mobile, tablet, and desktop screens with seamless collapsible navigation.
- **Preserve 100% Functionality & Tests:** Retain all backend integrations, state management, RBAC route protections, form handlers, and ensure all 70 Vitest unit/component tests continue passing without regressions.

### 2.2 Non-Goals
- Modifying backend schemas, Alembic migrations, database models, or FastAPI endpoints.
- Introducing external UI component libraries (e.g., MUI, Shadcn UI, AntD) that bloat bundle size or break the tailored neumorphic design language.
- Changing authentication mechanisms, role definitions (`RESIDENT`, `BARANGAY_STAFF`, `BARANGAY_ADMIN`, `SYSTEM_MAINTAINER`), or session security.

### 2.3 Anti-Goals
- **No Muddy or Excessive Shadows:** Avoid dark 16px–32px blurry shadows that obscure borders or cause visual clutter.
- **No Harsh or Neon Greens:** Avoid overly vibrant, unreadable neon shades that fail WCAG accessibility standards.
- **No Breaking Layout Changes:** Never break existing DOM identifiers, form field names, or navigation links that automated test suites assert against.

---

## 3. Evaluated Approaches & Selection

### Approach 1: Design-Token Cascade & Component Harmony *(SELECTED)*
- **Implementation:** Refine root design tokens in `globals.css` and `tailwind.config.ts` (canvas background, card surfaces, micro-shadow elevations, input sunken shadows, primary/secondary buttons, civic green color ramps). Then update layout wrappers (`RootLayout`, `Header`, `Footer`, `ResidentLayout`, `AdminLayout`) and polish core pages and components (`page.tsx`, `login/page.tsx`, `register/page.tsx`, `resident/page.tsx`, `admin/page.tsx`, `EcoBotWidget.tsx`, `StatusCard.tsx`).
- **Rationale:** Delivers immediate, consistent elevation across every page of the web application. Zero code duplication, completely maintainable, and guarantees all role protections and tests stay intact.

### Approach 2: Page-by-Page Ad-Hoc Styling *(REJECTED)*
- **Rationale:** Applying inline overrides on individual pages leads to styling drift, redundant code, and maintenance headaches across 15+ subpages.

### Approach 3: Complete Component Library Replacement *(REJECTED)*
- **Rationale:** Replacing custom components with third-party libraries conflicts with the project's custom tactile neumorphic identity, increases dependencies, and risks breaking test suites.

---

## 4. Visual Design System Specifications

### 4.1 Color Palette
- **Canvas Background:** `--background: #f4f8f5` (very faint calming sage tint).
- **Surface / Card Background:** `--card: #ffffff` (pure crisp white).
- **Foreground Text:**
  - Primary Content: `#0f172a` (Slate 900) / `#1e293b` (Slate 800) — WCAG AAA contrast.
  - Secondary / Helper Text: `#475569` (Slate 600) / `#64748b` (Slate 500) — WCAG AA contrast.
- **Civic Greens:**
  - Primary Action (`civic-forest`): `#0F5132` (accessible, authoritative civic green).
  - Hover Action (`civic-forestHover`): `#0b3d26`.
  - Accent / Vibrant (`civic-emerald`): `#198754`.
  - Soft Badge / Socket Tint: `#e8f5ec` (delicate mint) with text `#0F5132` and border `#c6e7d0`.
- **Borders & Dividers:** `rgba(226, 232, 240, 0.8)` or `rgba(16, 185, 129, 0.12)`.

### 4.2 Neumorphic Surface & Shadow Tokens
- **`.neu-card` / `.neu-surface`:**
  - Background: `#ffffff`
  - Border: `1px solid rgba(226, 232, 240, 0.7)` with subtle top highlight `rgba(255, 255, 255, 0.95)`
  - Shadow: `3px 3px 10px rgba(148, 163, 184, 0.16), -3px -3px 10px rgba(255, 255, 255, 0.95)`
  - Border Radius: `rounded-2xl` (16px) or `rounded-3xl` (24px) for hero/feature cards
- **`.neu-card-interactive`:**
  - Hover: subtle elevation `4px 4px 14px rgba(148, 163, 184, 0.22), -4px -4px 14px rgba(255, 255, 255, 1)`, `transform: translateY(-2px)`
  - Active: gentle press `inset 2px 2px 4px rgba(148, 163, 184, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.9)`
- **`.neu-input` & `.neu-select`:**
  - Background: `#f8faf8`
  - Border: `1px solid rgba(203, 213, 225, 0.7)`
  - Shadow: `inset 2px 2px 4px rgba(148, 163, 184, 0.14), inset -2px -2px 4px rgba(255, 255, 255, 0.85)`
  - Focus: border `#0F5132`, soft glow `0 0 0 3px rgba(15, 81, 50, 0.12)`
- **`.neu-btn-primary`:**
  - Background: `#0F5132`
  - Text: `#ffffff`
  - Shadow: `0 4px 12px rgba(15, 81, 50, 0.25)`
  - Hover: `#0b3d26`, `transform: translateY(-1px)`
- **`.neu-btn-secondary`:**
  - Background: `#ffffff`
  - Text: `#1e293b`
  - Border: `1px solid rgba(203, 213, 225, 0.6)`
  - Shadow: `2px 2px 6px rgba(148, 163, 184, 0.15), -2px -2px 6px rgba(255, 255, 255, 0.9)`

### 4.3 Typography & Spacing
- Consistent scale using default sans stack with antialiasing.
- Card padding: `p-5 sm:p-6 lg:p-8` for balanced breathing room.
- Section spacing: `space-y-6` to `space-y-10` preventing cramped card grids.
- Accessible focus rings: `focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2`.

---

## 5. Scope of Component and Page Refinement

1. **`globals.css` & `tailwind.config.ts`:**
   - Update CSS custom properties: `--background: #f4f8f5`, `--card: #ffffff`, `--border`, `--muted`.
   - Update `.neu-*` utility classes with delicate micro-shadows and clean white surfaces.
   - Refine `shadow-neu-*` entries in `tailwind.config.ts`.
2. **`RootLayout.tsx`:**
   - Update `body` background class to match `--background` (`#f4f8f5`).
3. **`Header.tsx` & `Footer.tsx`:**
   - Header: Translucent white/sage blur (`bg-white/90 backdrop-blur-md`), refined brand mark with emerald badge, clean navigation pill buttons.
   - Footer: Maintain authoritative civic emerald theme with cleaner contrast and typography.
4. **Portal Layouts (`ResidentLayout.tsx`, `AdminLayout.tsx`):**
   - Clean white sidebar cards with subtle sage borders.
   - Active navigation item with soft green chip (`bg-emerald-50 text-emerald-800 font-bold border border-emerald-200`).
   - Mobile menu drawers with crisp white backdrop and smooth touch ergonomics.
5. **Key Pages & Interactive Modules:**
   - Landing Page (`app/page.tsx`): Clean hero with floating white cards, modern civic badges, clear CTAs.
   - Auth Pages (`login/page.tsx`, `register/page.tsx`): Crisp white login and registration cards with refined inset inputs.
   - Resident Dashboard (`resident/page.tsx`): Polished KPI cards, clean report list items, refined announcements.
   - Admin Dashboard (`admin/page.tsx`): Polished metric counters, clean triage tables, and quick action cards.
   - Components (`StatusCard.tsx`, `EcoBotWidget.tsx`, `HealthDashboard.tsx`, `ImageUpload.tsx`): Consistent soft-neumorphic styling.

---

## 6. What is Left to the Builder

- Fine-tuning responsive padding across subpages (`p-4 sm:p-6 lg:p-8`).
- Preserving all existing ARIA labels, test attributes, and event handlers.
- Verifying the complete test suite (`npx vitest run`) passes with all 70 tests green.

---

## 7. Verification & Safety Safeguards

1. **Automated Vitest Suite:** Run `npx vitest run` to ensure no role gates, navigation links, or form behaviors broke.
2. **Next.js Production Build:** Run `npm run build` to verify clean compilation with zero TypeScript or styling syntax errors.
3. **Responsive Visual Check:** Ensure no horizontal overflow on mobile screens (`375px`, `768px`, `1024px`, `1280px`).
