# Gamified Civic Action System Design

## Intent

Give residents a privacy-conscious view of verified civic participation, meaningful tasks to complete, and a safe way to exchange earned SAB-Points for community rewards. Staff verification and the points ledger remain the authority for earned and spent points.

## Goals

- Show a leaderboard of at most 20 residents, ordered by ledger balance, with area, tier, and the current resident's relative rank. Do not expose email addresses; mask other residents' names.
- Show the five requested civic tasks with server-derived progress and clear actions that route residents to the existing report or claim workflows.
- Award task points only after a corresponding report or claim has been verified. Make each one-time or milestone award idempotent and record positive entries in `points_ledger`.
- Use the brief's point values: First Report 50, Proper Segregation 25, No Violation Record 25 (deferred), Waste Warrior 100, and Reporting Violations with Evidence 100.
- Keep “No Violation Record” visible but unavailable until the application has an authoritative citation source and monthly award workflow. Do not infer citations from resident-submitted reports.
- List active, in-stock reward items and allow the resident to review the balance, cost, and remaining points before confirming redemption.
- Create redemption history and a unique eight-character voucher code. Deduct points with a negative `REWARD_REDEMPTION` ledger entry in the same transaction as the redemption request and stock update.
- Let authorized barangay staff approve, fulfill, or cancel a redemption through a permission-guarded API operation; residents can view but cannot alter redemption status.
- Present leaderboard, tasks, rewards, claims, vouchers, and the ledger audit in the existing resident points page, using the existing API client and realtime refresh patterns.
- Seed catalog examples only as demo records (`is_demo_data=True`).

## Non-goals

- Building a violation-citation domain or issuing monthly no-violation bonuses in this change.
- Changing resident identity, area configuration, authentication, or the existing report and claim review workflows.
- Adding mobile-load integrations, storing phone numbers, procuring prizes, or automating physical reward pickup; reward items and voucher statuses are in-app academic records, consistent with the existing project scope.
- Awarding points for a report that has not passed the existing staff verification workflow.

## Constraints

- Preserve PostgreSQL as the production database and use Alembic for schema changes. Pytest continues to use its existing in-memory SQLite `StaticPool` fixture.
- Respect backend RBAC, CSRF, session, and privacy rules.
- Use existing `ParticipationClaim`, `Report`, `PointsLedger`, `RewardItem`, and `RedemptionRequest` patterns where they fit; avoid introducing a parallel product workflow.
- All balance decisions must use the ledger sum. Redemptions must prevent concurrent double-spend and overselling, not only validate against a stale balance.
- Activity verified before launch does not issue awards or count toward task progress/milestones.
- Existing local changes in the worktree must be preserved and integrated rather than reverted.

## Approaches

1. **Complete the existing implementation (selected).** Retain the current gamification schema, endpoints, and resident page; fix correctness gaps and connect verified actions to idempotent ledger awards. This matches the existing worktree and avoids replacing working surfaces.
2. **Add a dedicated mission-award workflow.** Introduce explicit task-cycle/award records and staff-review endpoints. This offers richer task-specific auditing but creates a second review workflow and expands the schema beyond the requested existing report/claim process.

Approach 1 is selected as the least disruptive complete solution. The monthly no-violation award remains unavailable rather than using an unreliable proxy.

## Design and behavior

### Persistence and awards

- Keep the reward catalog and redemption tables and their existing demo catalog defaults.
- Preserve the points ledger as the canonical balance. Add only the persistence needed to make task awards uniquely identifiable and idempotent; use a migration for any schema change.
- First Report awards 50 points once after the resident's first valid report is verified.
- Proper Segregation awards 25 points for each approved segregation claim. That 25-point task award is the claim's points award, not an additional duplicate award.
- Add a structured claim type so staff-approved segregation claims can be distinguished from other participation claims. Waste Warrior counts only these approved segregation claims and awards 100 points once when the resident reaches ten.
- Reporting Violations with Evidence awards 100 points once after staff verification of a report containing photo evidence, geotag coordinates, and a non-empty location description.
- No Violation Record is represented as unavailable and awards no points until an authoritative citation source exists.
- Task API responses reflect eligibility, completion/progress, and the points that can be earned. Task action buttons route to the existing resident report or participation claim flows.
- Start the award/progress eligibility window at feature launch; do not backfill awards or milestone progress from older reports or claims.

### Leaderboard

- Compute balances from `points_ledger` and verified activity counts from approved records.
- Include at most 20 highest-ranked residents, plus the signed-in resident if they fall outside that page, with their actual rank.
- Use a masked name for other residents and the resident's own full name for their own highlighted row. Expose no email address.
- Resolve each `purok_name` from the resident's configured `Area`; use a neutral fallback for residents without an area.
- Apply stable tie-breaking after points and verified activity count.

### Reward redemption

- Return active rewards and their stock availability.
- On redemption, lock the resident and reward records in a consistent order, recalculate the ledger balance, and reject insufficient balance or unavailable stock before writing.
- Create the redemption request, negative ledger entry, and finite-stock decrement atomically. Do not let zero stock behave as unlimited.
- Generate a collision-checked, exactly eight-character voucher code. Return the resulting request to the resident and include it in their history.
- Add a permission-guarded staff/admin review operation for redemption requests. Permit `PENDING` to transition to `APPROVED` or `CANCELLED`, and `APPROVED` to transition to `FULFILLED`. Residents can only read their own redemption history. These statuses record in-app staff review; they do not represent an external mobile-load, procurement, or fulfillment integration.
- Maintain the four states already defined by the domain: `PENDING`, `APPROVED`, `FULFILLED`, and `CANCELLED`.
- When a pending redemption is cancelled, refund its points with a positive compensating ledger entry and restore stock in the same transaction. Do not silently edit or delete the original deduction.

### Frontend

- Keep four tabs: Leaderboard, Civic Tasks, Redeem Rewards, and My Claims & Redemptions.
- Show available task progress and use task-specific actions; show the no-violation task as unavailable with an explanation.
- Disable reward redemption for insufficient balance or unavailable stock, then show a confirmation modal with cost and remaining balance.
- On success, show the voucher code and refresh the resident's balance, catalog, task progress, and claim history.
- Retain the existing visual style and `useRealtimeSync` behavior; surface API failures instead of silently substituting empty data for failed endpoints.

## Builder decisions

- Reuse existing endpoint and schema conventions unless a narrowly scoped extension is necessary for idempotent awards or atomic redemption.
- Use existing staff verification transitions as the authority for report awards. Do not introduce a separate reviewer workflow.
- Use the existing participation-review permission for barangay staff/admin redemption review; no separate staff frontend is included in this resident-facing change.
- Treat “future only” as excluding both award backfills and pre-launch progress toward the ten-claim milestone.
- Treat reward catalog and voucher statuses as in-app academic records only; do not collect a resident phone number or claim that a real reward was provided.
- Restore a cancelled pending redemption's points and stock atomically, recording the refund as a compensating ledger entry.
- Follow established API error responses and resident-page interaction patterns.
- Add focused backend and frontend tests for ordering/privacy, each award's verification and idempotency, exact voucher shape, insufficient balance, stock exhaustion, cancellation refunds, and atomic ledger/request behavior.
