---
id: functional-core
title: General Functional Test Scenarios (Core)
tags: [general, functional, smoke, regression]
version: 1.0
---

## Intent
Provide a universal set of functional test scenarios that apply to most features, even when the domain is unknown.

## Use This Skill
- Always include for MVP generation as the baseline
- Especially helpful when requirements are short, vague, or novel

## Core Scenario Catalog

### Happy Path
- User completes the primary goal successfully
- Data is persisted and visible where expected
- Success messaging and next navigation are correct

### Validation and Error Handling
- Required inputs missing
- Invalid formats (where applicable)
- Clear error messages and no data corruption
- Errors are recoverable (user can fix and resubmit)

### Permissions and Roles
- Authorized user can perform the action
- Unauthorized user is blocked (no partial side effects)
- Read vs write permissions enforced consistently

### Data Integrity
- No duplicate records on retries/double submit
- Updates are applied to the correct entity
- Delete/archive behavior matches requirement (hard delete vs soft delete)

### Idempotency and Repeats
- Repeat the same action and verify stable behavior
- Refresh/reload after action and verify state remains correct

### Concurrency (Lightweight)
- Two users edit/act on the same item and system behaves predictably (conflict, last-write, lock)

### Edge Content
- Special characters and long text where text is accepted
- Leading/trailing spaces handling

### UX Behavior (Basic)
- Loading states during async operations
- Buttons disabled to prevent duplicate submits
- Focus moves to first error (if UI)

## Output Notes (Test Case Shape)
- Produce at least:
  - 3-5 P0/P1 happy-path tests across primary flows
  - 5-10 negative/validation tests
  - 2-3 permission tests (if roles exist)
- Use tags like `happy-path`, `validation`, `permissions`, `integrity`, `idempotency`
