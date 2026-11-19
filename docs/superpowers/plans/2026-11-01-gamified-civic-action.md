# Gamified Civic Action System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the resident civic leaderboard, verified task awards, and points redemption workflow using the existing gamification module and points page.

**Architecture:** Keep `points_ledger` as the balance source, extend existing claims and report review events to post idempotent task awards, and make redemption/review mutations transactional. Complete the existing resident points page and API contracts without adding real prize procurement, mobile-load integration, or resident phone data.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, Pytest with SQLite `StaticPool`, Next.js 16, React 19, TypeScript, Vitest, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-11-01-gamified-civic-action-design.md`

## Global Constraints

- PostgreSQL is the mandatory primary development and production database.
- Schema modifications must be performed via Alembic migrations in `apps/api/alembic/versions`.
- Pytest continues to use `sqlite:///:memory:` with `StaticPool` exclusively for hermetic test isolation.
- Respect backend RBAC, CSRF, session, and privacy rules; never expose resident email addresses on the leaderboard.
- All synthetic catalog seed records have `is_demo_data=True`.
- Use `points_ledger` for balance calculation; redemption deductions are negative `REWARD_REDEMPTION` transactions.
- Task award actions are future-only; old reports and claims do not award points or count toward milestones.
- Reward catalog and voucher statuses are in-app academic records only; do not collect phone numbers or implement real-world fulfillment.
- Preserve existing uncommitted workspace changes and do not commit as part of this task.

## Review Focus

1. **Concurrent redemption and finite stock:** two redemptions must not spend the same balance or redeem past zero stock. Test the one-stock boundary and verify no partial ledger/request writes on failure in Task 2; retain PostgreSQL row locks because SQLite's test dialect cannot verify production lock behavior.
2. **Repeated or reordered staff verification:** only the first eligible status transition may award a one-time task bonus; test duplicate review and status changes in Task 1.
3. **Incomplete evidence:** a resolved report without photo, geotag coordinates, or location description must not earn the evidence bonus. Test each missing requirement in Task 1.
4. **Resident isolation and authorization:** residents must not review redemptions or read another resident's voucher history. Test resident rejection and ownership scoping in Task 2.
5. **Rank ties and out-of-page current resident:** sorting must be stable and the current resident must retain their true rank even when outside the top 20. Test ties and the appended current-resident entry in Task 1.

---

### Task 1: Verified Civic Task Awards, Progress, and Leaderboard

**Files:**
- Modify: `apps/api/app/modules/gamification/models.py`
- Modify: `apps/api/app/modules/gamification/schemas.py`
- Modify: `apps/api/app/modules/gamification/service.py`
- Modify: `apps/api/app/modules/reports/models.py`
- Modify: `apps/api/app/api/v1/endpoints/reports.py`
- Create: `apps/api/alembic/versions/0009_civic_task_awards.py`
- Create: `apps/api/alembic/versions/0010_report_task_eligibility.py`
- Modify: `apps/api/tests/test_gamification_rewards.py`
- Modify: `apps/api/tests/test_reports.py`

**Interfaces:**
- Consumes: Existing `review_claim`, `update_report_status`, `PointsLedger`, `ParticipationClaim`, and `Report` flows.
- Produces: `ClaimActivityType` (`SEGREGATION`, `COMMUNITY_CLEANUP`, `OTHER`); unique task award metadata on ledger entries; `get_civic_tasks(db, resident_id)` statuses `AVAILABLE`, `IN_PROGRESS`, `COMPLETED`, or `UNAVAILABLE`; verified report/claim award helpers called inside the existing review transactions.

- [ ] **Step 1: Write failing API tests**

Add tests named:
- `test_approved_segregation_claim_awards_exactly_25_points`
- `test_segregation_claim_rejects_custom_point_override`
- `test_waste_warrior_awards_100_points_on_tenth_new_segregation_claim_only`
- `test_first_report_award_waits_for_staff_resolution`
- `test_prelaunch_report_cannot_earn_task_awards_after_resolution`
- `test_evidence_report_award_requires_photo_coordinates_and_location`
- `test_no_violation_task_is_unavailable_without_citation_records`
- `test_leaderboard_orders_points_masks_names_and_includes_true_current_rank`

Assert segregation approval produces a single 25-point award (not the existing generic claim award plus a duplicate task bonus); the tenth newly approved segregation claim adds one 100-point Waste Warrior bonus; report awards are posted only for post-launch reports after staff sets `RESOLVED`; the evidence award requires a photo URL, latitude, longitude, and non-empty location; no pre-launch records contribute; leaderboard ties sort deterministically, hide other residents' full names/emails, resolve area names, and preserve the signed-in resident's actual rank.

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `cd apps/api && .\.venv\Scripts\python.exe -m pytest tests/test_gamification_rewards.py tests/test_reports.py -v`

Expected: FAIL because claim type/award metadata are absent, current task progress is not tied to verified event records, and task eligibility/evidence criteria are incomplete.

- [ ] **Step 3: Add the migration-backed award identity**

In `models.py`, add `ClaimActivityType` and `ParticipationClaim.activity_type` with `OTHER` as the default. Add nullable `task_key` and `task_source_id` metadata to `PointsLedger`, with a uniqueness constraint on `(resident_id, task_key, task_source_id)` so task award writes are idempotent while ordinary ledger entries remain unchanged. In `0009_civic_task_awards.py`, add these columns and the uniqueness constraint after revision `0008_rewards_and_redemptions`; give existing claims the `OTHER` value. Add nullable/default-false report eligibility in `0010_report_task_eligibility.py`; existing reports remain ineligible.

- [ ] **Step 4: Connect award rules to existing verification transactions**

Extend `ClaimCreate` and claim submission to preserve the structured activity type. In `review_claim`, award exactly 25 points for each newly approved `SEGREGATION` claim and use its claim ID as the task source; reject a custom `points_awarded` override for this fixed-value claim. Retain the existing award behavior for non-segregation claims. Count newly posted segregation task awards; when the tenth is approved, post exactly one 100-point `waste_warrior` bonus keyed to the resident. Lock the resident row before counting/inserting awards; keep the uniqueness constraint as the final idempotency guard.

Add a report-award helper in `service.py` and call it from `update_report_status` before its existing commit. Set the report eligibility marker only on report creation after this feature is active; a missing/false marker excludes all pre-launch reports. Only an eligible post-launch report transitioning to `RESOLVED` can post awards: the first verified report earns 50 points once; a verified report with photo, latitude, longitude, and a location description earns the 100-point evidence task once. Use a resident-scoped unique task key for each non-repeatable task.

- [ ] **Step 5: Derive task progress and leaderboard from verified records**

Update `get_civic_tasks` to use newly created task award records as progress, return `UNAVAILABLE` for No Violation Record, and preserve the specified values (50, 25, 25 unavailable, 100, 100). Update leaderboard ordering to use verified ledger balances, area names, stable tie-breaking, privacy-masked names for other residents, and include the current resident with their true rank when outside the top 20.

- [ ] **Step 6: Run focused backend tests**

Run: `cd apps/api && .\.venv\Scripts\python.exe -m pytest tests/test_gamification_rewards.py tests/test_reports.py -v`

Expected: PASS, including exact awards, no pre-launch backfill, task idempotency, privacy serialization, area mapping, and geotag evidence checks.

### Task 2: Atomic Reward Redemption and Barangay Review

**Files:**
- Modify: `apps/api/app/modules/gamification/models.py`
- Modify: `apps/api/app/modules/gamification/schemas.py`
- Modify: `apps/api/app/modules/gamification/service.py`
- Modify: `apps/api/app/api/v1/endpoints/gamification.py`
- Modify: `apps/api/alembic/versions/0008_rewards_and_redemptions.py`
- Create: `apps/api/alembic/versions/0011_reward_voucher_copy.py`
- Modify: `apps/api/tests/test_gamification_rewards.py`

**Interfaces:**
- Consumes: `RewardItem`, `RedemptionRequest`, ledger balances, and `Permission.PARTICIPATION_REVIEW`.
- Produces: `review_redemption(db, redemption_id, reviewer_id, payload)` with guarded transitions; `PATCH /api/v1/gamification/redemptions/{redemption_id}/review`; eight-character voucher codes; `REWARD_REFUND` compensating transactions for cancelled pending requests.

- [ ] **Step 1: Write failing redemption and review tests**

Add tests named:
- `test_redemption_rejects_insufficient_balance_without_writes`
- `test_redemption_deducts_ledger_and_returns_eight_character_code`
- `test_redemption_rejects_zero_stock_without_writes`
- `test_staff_can_approve_then_fulfill_redemption`
- `test_resident_cannot_review_redemption`
- `test_cancelling_pending_redemption_refunds_points_and_stock_once`
- `test_redemption_review_rejects_invalid_status_transition`
- `test_my_redemptions_only_returns_current_resident_requests`
- `test_reward_descriptions_disclose_in_app_demonstration_only`

Assert insufficient balance returns 400, successful redemption creates a negative ledger row with type `REWARD_REDEMPTION`, code length is exactly eight uppercase alphanumeric characters, stock decrements once, and zero stock is unavailable. Assert staff/admin can move `PENDING -> APPROVED -> FULFILLED`; only `PENDING -> CANCELLED` refunds points and stock using one positive `REWARD_REFUND` entry; resident review is forbidden and resident history is scoped. Default descriptions must clearly state that the app records demo vouchers only and does not issue mobile credit or physical goods.

- [ ] **Step 2: Run focused tests and verify they fail**

Run: `cd apps/api && .\.venv\Scripts\python.exe -m pytest tests/test_gamification_rewards.py -v`

Expected: FAIL on voucher length, zero-stock handling, atomic balance checks, missing review route, missing refund transaction type, and missing cancellation accounting.

- [ ] **Step 3: Add the refund transaction type**

Add `TransactionType.REWARD_REFUND`. This is stored in the existing non-native string enum column and does not require a schema migration. Update runtime defaults and the uncommitted `0008_rewards_and_redemptions.py` seed descriptions to disclose that catalog items are academic demonstrations only. Add `0011_reward_voucher_copy.py` after `0010_report_task_eligibility` to update the descriptions of existing demo reward rows, without changing custom catalog records.

- [ ] **Step 4: Implement atomic redemption and voucher creation**

In `redeem_reward`, lock resident then reward rows with `SELECT ... FOR UPDATE`, recompute the ledger balance inside the transaction, reject insufficient balance or `stock_quantity <= 0`, and atomically create the redemption, negative ledger entry, and stock decrement. Generate a collision-checked, exactly eight-character uppercase alphanumeric claim code; retry only on a code uniqueness conflict.

- [ ] **Step 5: Implement staff review transitions and cancellation accounting**

Add a typed review payload and service transition guard. Require `Permission.PARTICIPATION_REVIEW` and CSRF on the new PATCH endpoint. Permit only `PENDING -> APPROVED`, `PENDING -> CANCELLED`, and `APPROVED -> FULFILLED`. On cancellation, write one positive `REWARD_REFUND` entry and restore finite stock in the same transaction; record reviewer and notes. Broadcast the status change through the existing realtime manager.

- [ ] **Step 6: Run focused backend tests**

Run: `cd apps/api && .\.venv\Scripts\python.exe -m pytest tests/test_gamification_rewards.py tests/test_gamification.py -v`

Expected: PASS, including unchanged existing claim behavior, insufficient-balance rejection, eight-character vouchers, stock boundaries, status permissions, and cancellation accounting.

### Task 3: Resident Points Page and Typed API Integration

**Files:**
- Modify: `apps/web/src/types/gamification.ts`
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/web/src/app/resident/points/page.tsx`
- Modify: `apps/web/src/app/admin/participation/page.tsx`
- Create: `apps/web/tests/ResidentPointsPage.test.tsx`
- Create: `apps/web/tests/AdminParticipation.test.tsx` for fixed segregation-point review presentation.

**Interfaces:**
- Consumes: Task 1/2 API shapes and the existing `useRealtimeSync` hook.
- Produces: typed task/review/refund transaction states; existing `getLeaderboard`, `getCivicTasks`, `getRewards`, `redeemReward`, and `getMyRedemptions` helpers plus a typed redemption-review helper; four-tab resident points UI.

- [ ] **Step 1: Write failing resident page tests**

Add tests asserting the four tabs render; leaderboard identifies the resident and masks other names; No Violation Record is visibly unavailable and cannot be claimed; segregation claim action sends `activity_type: "SEGREGATION"`; unaffordable/out-of-stock rewards cannot be redeemed; confirmation shows balance, cost, and remaining points; successful redemption presents the eight-character voucher; history displays statuses and negative/positive ledger entries; API load failures show an error instead of empty success-shaped results.

- [ ] **Step 2: Run the focused frontend test and verify it fails**

Run: `cd apps/web && cmd.exe /c npm test -- tests/ResidentPointsPage.test.tsx`

Expected: FAIL because the page and types do not yet represent the completed task/award/redemption states.

- [ ] **Step 3: Define typed API contracts**

Add unions for `ClaimActivityType`, civic task status including `UNAVAILABLE`, and `REWARD_REFUND`. Add the redemption review payload/response type and `reviewRedemption` helper for the permission-protected staff endpoint. Preserve the existing five resident API helper signatures and URL shapes.

- [ ] **Step 4: Complete resident and staff claim-review behavior**

Keep the four resident tabs and current visual design. Set the segregation action's claim type; render unavailable task state and progress; disable redeem actions for insufficient balance or stock; retain the confirmation and success voucher modals; show cancellation/refund history; and change points-page realtime sync to receive relevant report, claim, and reward events. In the staff participation review UI, show the structured claim type and make the fixed 25-point segregation award clear instead of presenting it as an arbitrary custom award. Remove per-endpoint empty-array catches so API failures reach the page error state.

- [ ] **Step 5: Run the focused frontend test**

Run: `cd apps/web && cmd.exe /c npm test -- tests/ResidentPointsPage.test.tsx`

Expected: PASS with all four tabs, task states, redemption guardrails, voucher success state, history, and surfaced API errors verified.

### Task 4: Full Verification and Documentation Consistency

**Files:**
- Verify: `apps/api/alembic/versions/0008_rewards_and_redemptions.py`
- Verify: `apps/api/alembic/versions/0009_civic_task_awards.py`
- Verify: `apps/api/alembic/versions/0010_report_task_eligibility.py`
- Verify: `apps/api/alembic/versions/0011_reward_voucher_copy.py`
- Verify: `docs/DECISION_LOG.md`
- Verify: `docs/superpowers/specs/2026-11-01-gamified-civic-action-design.md`

**Interfaces:**
- Consumes: Completed backend and frontend changes from Tasks 1–3.
- Produces: Verified migration chain, passing backend/frontend suites, successful Next.js production build, and documentation that continues to distinguish in-app vouchers from real-world fulfillment.

- [ ] **Step 1: Run the complete backend test suite**

Run: `cd apps/api && .\.venv\Scripts\python.exe -m pytest tests -v`

Expected: PASS with all existing tests and the added gamification/report tests.

- [ ] **Step 2: Run the complete frontend test suite**

Run: `cd apps/web && cmd.exe /c npm test`

Expected: PASS.

- [ ] **Step 3: Run the frontend production build**

Run: `cd apps/web && cmd.exe /c npm run build`

Expected: PASS with no TypeScript or build errors.

- [ ] **Step 4: Inspect migration chain and final diff**

Verify migration revisions chain from `0008_rewards_and_redemptions` through `0011_reward_voucher_copy`, inspect `git diff --check` and `git status --short`, and confirm no unrelated pre-existing workspace changes were altered. Do not commit.
