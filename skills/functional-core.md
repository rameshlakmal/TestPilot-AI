---
id: functional-core
title: General Functional Test Scenarios (Core)
tags: [general, functional, smoke, regression]
version: 1.1
---

## Intent
Provide a universal set of functional test scenarios that apply to most features, even when the domain is unknown.

This is a baseline catalog. Layer domain-specific scenarios on top.

## Use This Skill
- Always include for MVP generation as the baseline
- Especially helpful when requirements are short, vague, or novel

## Assumptions
- There is a primary actor (user/system) and a primary goal (create/update/submit/trigger something).
- There is a source of truth (DB/service) even if the UI is the only visible surface.
- If any assumption is false, call it out and adapt the catalog.

## Core Scenario Catalog

### Happy Path
- User completes the primary goal successfully
- Data is persisted and visible where expected
- Success messaging and next navigation are correct
- Result is consistent across refresh/re-open/re-fetch
- Primary goal works end-to-end (UI/API/DB), not just locally

### Alternate Paths
- User cancels mid-flow and no partial side effects remain
- User saves a draft / partially completes and resumes later (if applicable)
- User completes the flow via an alternate entry point (deep link, shortcut, retry)

### Validation and Error Handling
- Required inputs missing
- Invalid formats (where applicable)
- Clear error messages and no data corruption
- Errors are recoverable (user can fix and resubmit)
- Cross-field validations (e.g., start <= end, mutually exclusive fields)
- Server-side validation matches client-side validation (no silent acceptance)
- Partial failure handling (one step fails after prior step succeeded)

### Permissions and Roles
- Authorized user can perform the action
- Unauthorized user is blocked (no partial side effects)
- Read vs write permissions enforced consistently
- Object-level authorization enforced (cannot access others' resources)
- Admin/support flows behave differently only when explicitly allowed

### Data Integrity
- No duplicate records on retries/double submit
- Updates are applied to the correct entity
- Delete/archive behavior matches requirement (hard delete vs soft delete)
- Referential integrity preserved (dependent objects, counts, aggregates)
- Data normalization rules enforced (case sensitivity, trimming, canonicalization)
- Audit fields correct (createdBy/updatedBy/timestamps) when applicable

### Idempotency and Repeats
- Repeat the same action and verify stable behavior
- Refresh/reload after action and verify state remains correct
- Back/forward navigation does not duplicate actions
- Retrying after a timeout does not create duplicates

### Concurrency (Lightweight)
- Two users edit/act on the same item and system behaves predictably (conflict, last-write, lock)
- Optimistic concurrency behavior is correct (versioning/ETags/updatedAt checks) if present
- Background updates do not overwrite newer user changes

### Edge Content
- Special characters and long text where text is accepted
- Leading/trailing spaces handling
- Empty vs null vs missing treated consistently
- Unicode/emoji handling only if the product already supports it
- Large numbers / precision / rounding rules where applicable

### UX Behavior (Basic)
- Loading states during async operations
- Buttons disabled to prevent duplicate submits
- Focus moves to first error (if UI)
- Undo/rollback affordances behave correctly (if provided)
- Inline vs toast vs banner messages appear in the right place and persist appropriately

### Navigation and Deep Links (If UI)
- Deep link lands on the correct state (selected item, tab, filter)
- Browser refresh on a detail view preserves state or recovers gracefully
- Invalid/missing route params show a safe error state (not a crash)

### List/Search/Filter/Sort (If Present)
- Search returns expected matches (case/partial match rules)
- Filters combine correctly (AND/OR behavior is defined)
- Sorting is stable and consistent across pages
- Pagination/infinite scroll does not skip/duplicate items

### Files and Imports/Exports (If Present)
- Upload accepts allowed types/sizes and rejects disallowed inputs with clear errors
- Import validates rows and reports errors without corrupting good data
- Export matches visible filters/permissions and contains expected fields

### Integrations and Side Effects (If Present)
- External calls are made exactly once when appropriate
- Webhooks/events/notifications fire with correct payload and ordering
- Failures are retried or surfaced according to policy; no silent drops

### Resilience and Degraded Modes
- Network timeout/offline produces a usable error state
- Retry/backoff behavior does not spam duplicates
- Partial availability (downstream dependency unavailable) degrades safely

### Security Basics (Functional)
- Input is safely handled (no reflected content in UI; no obvious injection vectors)
- Sensitive fields are masked/redacted in UI/logs where applicable
- Session expiration causes a safe re-auth flow without data loss (where feasible)

### Accessibility Basics (Functional)
- Keyboard-only completion of the primary flow (if UI)
- Errors are announced/visible and associated to fields (if UI)
- Visible focus and correct tab order for primary interactions

### Localization/Time (If Applicable)
- Time zone and date formatting are consistent (display vs storage)
- Boundary dates/times (DST shifts, end-of-month) behave predictably

## Output Notes (Test Case Shape)
- Produce at least:
  - 3-5 P0/P1 happy-path tests across primary flows
  - 5-10 negative/validation tests
  - 2-3 permission tests (if roles exist)
  - 2-4 integrity/idempotency/concurrency tests (pick the most likely failure modes)
- Prefer table-driven tests for rules and validations when combinations matter
- Always note assumptions and unknowns as explicit follow-ups
- Use tags like `happy-path`, `alt-path`, `validation`, `permissions`, `integrity`, `idempotency`, `concurrency`, `integration`, `resilience`, `accessibility`
