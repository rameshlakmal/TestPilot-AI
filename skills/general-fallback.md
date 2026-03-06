---
id: general-fallback
title: General Scenario Catalog (Fallback)
tags: [general, fallback, functional, negative, boundary, resilience]
version: 1.0
---

## Intent
Use this skill when a requirement does not match any domain-specific skill. It provides a universal scenario catalog that can be adapted to almost any feature.

Coverage goal: always include positive (happy path), negative (invalid/forbidden/failure), and edge-case scenarios.

This skill is designed to work with this app's workflow:
- Preflight: identify missing info questions and assumptions.
- Generation: produce full test cases using the app's JSON schema (IDs, steps, expected results, etc.).

## How to Apply
1. Decompose the requirement into: actor, goal, data inputs, rules, states, integrations, side effects.
2. Use the scenario catalog below to generate atomic test cases.
3. If critical details are missing, list them in `missingInfoQuestions` (preflight) and keep generation assumptions explicit.

## Universal Scenario Catalog

### Core Functional
- Happy path: primary goal succeeds with valid inputs.
- Alternate path(s): valid variations (different roles, different options, different states).
- Cancel/abort: user cancels or navigates away; verify no unintended side effects.
- Refresh/reload: state remains consistent after reload.

### Validation & Input Handling
- Required inputs missing, empty, or whitespace-only.
- Invalid format, wrong type, or unexpected structure (API/JSON).
- Boundary conditions at min/max and just outside (BVA).
- Duplicate submissions: double-click / retry / repeat request.
- Uniqueness constraints (if applicable) and duplicate detection.

### Permissions & Access
- Authorized user can perform action.
- Unauthorized user cannot perform action and no partial side effects occur.
- Visibility rules: data shown/hidden per role.

### Rules & Business Logic
- Decision rules: correct outcome for each rule branch (use decision tables if true logic).
- State transitions: allowed vs blocked transitions (use state transition testing when lifecycle exists).
- Derived values: totals, rounding, date/time calculations (if applicable).

### Reliability & Failure Handling
- Network timeout/interruption during submit: safe error + retry behavior.
- Partial failure in multi-step operations: no data corruption, consistent rollback/compensation.
- Idempotency: repeating the same operation does not create duplicates.

### Data Integrity & Persistence
- Data saved correctly and visible in all relevant views.
- Data remains correct after logout/login.
- Concurrent changes: conflict behavior is correct (lock, merge, last-write, or error) based on requirement.

### Usability & Accessibility (Baseline)
- Keyboard-only completion of primary flow.
- Clear errors; focus moves to the first invalid field when relevant.

### Compatibility (Baseline)
- Responsive UI does not break on mobile width.

## Quality Constraints
- Prefer atomic test cases (one main assertion).
- Avoid duplicates or reworded repeats.
- Do not invent features; if unclear, ask a question or add an assumption.

## Output Notes
- During generation, output must follow the app's JSON schema.
- `missingInfoQuestions` should include only questions that materially change test design.
- If clarifications are provided, do not repeat already-answered questions.
