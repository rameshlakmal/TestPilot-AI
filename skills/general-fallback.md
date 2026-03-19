---
id: general-fallback
title: General Scenario Catalog (Fallback)
tags: [general, fallback, functional, negative, boundary, resilience, security, accessibility]
version: 1.1
---

## Intent
Use this skill when a requirement does not match any domain-specific skill. It provides a universal scenario catalog that can be adapted to almost any feature.

Coverage goal: always include positive (happy path), negative (invalid/forbidden/failure), and edge-case scenarios.

This is a fallback. If a more specific skill applies, prefer that. If you need a deeper breakdown first, use `skills/feature-decomposition.md` to partition the feature into testable dimensions.

This skill is designed to work with this app's workflow:
- Preflight: identify missing info questions and assumptions.
- Generation: produce full test cases using the app's JSON schema (IDs, steps, expected results, etc.).

## How to Apply
1. Decompose the requirement into: actor, goal, data inputs, rules, states, integrations, side effects.
2. Use the scenario catalog below to generate atomic test cases.
3. If critical details are missing, list them in `missingInfoQuestions` (preflight) and keep generation assumptions explicit.

Practical rule: start with a minimal end-to-end slice (one happy path) to validate you understood the feature, then expand with negatives/edges.

## Universal Scenario Catalog

### Core Functional
- Happy path: primary goal succeeds with valid inputs.
- Alternate path(s): valid variations (different roles, different options, different states).
- Cancel/abort: user cancels or navigates away; verify no unintended side effects.
- Refresh/reload: state remains consistent after reload.
- Resume: user can continue after interruption (if drafts/sessions exist).
- Multiple entry points: the same goal works from all supported entry paths (menu, deep link, API call).

### Validation & Input Handling
- Required inputs missing, empty, or whitespace-only.
- Invalid format, wrong type, or unexpected structure (API/JSON).
- Boundary conditions at min/max and just outside (BVA).
- Duplicate submissions: double-click / retry / repeat request.
- Uniqueness constraints (if applicable) and duplicate detection.
- Cross-field validation: fields consistent together (date ranges, mutually exclusive options, dependent fields).
- Canonicalization: trimming, case normalization, locale rules, consistent parsing.
- Large payloads: long text, many items, large numbers, precision/rounding.

### Permissions & Access
- Authorized user can perform action.
- Unauthorized user cannot perform action and no partial side effects occur.
- Visibility rules: data shown/hidden per role.
- Object-level access: cannot read/update/delete resources owned by others.
- Tenant/project scoping: data cannot leak across org/workspace boundaries (if multi-tenant).
- Session expiration: action fails safely and user can recover after re-auth.

### Rules & Business Logic
- Decision rules: correct outcome for each rule branch (use decision tables if true logic).
- State transitions: allowed vs blocked transitions (use state transition testing when lifecycle exists).
- Derived values: totals, rounding, date/time calculations (if applicable).
- Ordering: where sequence matters (first/last, priority rules, tie-breaking) verify determinism.
- Invariants: rules that must always hold (e.g., balances never negative, counts consistent).

### Reliability & Failure Handling
- Network timeout/interruption during submit: safe error + retry behavior.
- Partial failure in multi-step operations: no data corruption, consistent rollback/compensation.
- Idempotency: repeating the same operation does not create duplicates.
- Dependency failure: downstream service unavailable returns a clear error and preserves consistency.
- Rate limiting: throttling produces expected error behavior without breaking clients.
- Retries: automatic retries (if any) do not double-apply side effects.

### Data Integrity & Persistence
- Data saved correctly and visible in all relevant views.
- Data remains correct after logout/login.
- Concurrent changes: conflict behavior is correct (lock, merge, last-write, or error) based on requirement.
- Referential integrity: related objects update consistently (counts, aggregates, denormalized views).
- Delete/archive/restore: behavior matches requirement; links and search results reflect changes.
- Auditability: createdBy/updatedBy/timestamps (and audit log entries) correct when applicable.

### Usability & Accessibility (Baseline)
- Keyboard-only completion of primary flow.
- Clear errors; focus moves to the first invalid field when relevant.
- Loading/disabled states prevent accidental duplicate actions.
- Empty states are informative and actionable (no dead-ends).

### Compatibility (Baseline)
- Responsive UI does not break on mobile width.

### Navigation & Deep Links (If UI)
- Deep links land in the correct state (selected item/tab/filter).
- Refresh on a detail view recovers gracefully (no crashes, safe error when missing).
- Back/forward navigation does not re-trigger destructive operations.

### List/Search/Filter/Sort (If Present)
- Search match rules are consistent (case/partial/stemming if defined).
- Filters combine correctly (AND/OR behavior defined) and persist as expected.
- Sorting is stable and pagination/infinite scroll does not skip/duplicate items.

### Files, Import/Export (If Present)
- Upload accepts allowed types/sizes; rejects disallowed with clear messages.
- Import validates input and reports row-level errors without corrupting valid data.
- Export respects permissions and active filters; exported data formats are correct.

### Integrations & Side Effects (If Present)
- Webhooks/events/notifications fire exactly once when appropriate and include correct payload.
- External calls are not made on validation failures.
- Side effects are ordered and consistent (e.g., save then notify; notify not sent on rollback).

### Security & Privacy (Functional)
- Sensitive fields are masked/redacted where required (UI, logs, exports).
- Inputs are safely rendered (no reflected HTML/JS in UI surfaces).
- Error responses do not leak secrets or internal identifiers.

### Localization & Time (If Applicable)
- Time zones: display vs storage consistent; DST and end-of-month boundaries handled.
- Locale formatting: dates/numbers/currency consistent with chosen locale.

## Quality Constraints
- Prefer atomic test cases (one main assertion).
- Avoid duplicates or reworded repeats.
- Do not invent features; if unclear, ask a question or add an assumption.
- Prefer table-driven tests when rules have multiple dimensions.
- When a flow has side effects, include at least one test that verifies "no side effects on failure".

## Output Notes
- During generation, output must follow the app's JSON schema.
- `missingInfoQuestions` should include only questions that materially change test design.
- If clarifications are provided, do not repeat already-answered questions.

Recommended tags (use what applies): `happy-path`, `alt-path`, `validation`, `boundary`, `permissions`, `state`, `integrity`, `idempotency`, `concurrency`, `integration`, `resilience`, `security`, `accessibility`, `localization`.
