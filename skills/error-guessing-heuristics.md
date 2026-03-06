---
id: error-guessing-heuristics
title: Error Guessing Heuristics
tags: [technique, negative, resilience, exploratory]
version: 1.0
---

## Intent
Generate high-yield negative and edge scenarios based on common failure patterns and past defect archetypes.

## When to Use
- Ambiguous requirements
- Complex integrations
- Areas with many historical defects

## Heuristic Catalog (Turn Into Tests)
- Missing/empty/null/whitespace inputs
- Wrong type inputs (API) and unexpected formats
- Duplicate submissions / double-click / repeated requests
- Timeouts, slow network, offline mid-operation
- Partial failures (one of multiple API calls fails)
- Stale data / optimistic concurrency conflicts
- Permissions drift (user role changes during session)
- Large payloads / long strings / many items
- Clock issues (timezone, DST, client clock skew)
- Cache issues (stale reads after writes)
- Idempotency: retry the same request
- External dependency down (email/SMS/payment)

## Method
1. Pick the relevant heuristics for the feature.
2. For each heuristic, define:
   - Trigger condition
   - Expected system behavior (error, retry, rollback)
   - Data integrity expectation (no partial writes)
3. Write atomic tests that are easy to reproduce.

## Scenario Templates
- [Negative] Double-submit and verify single record created
- [Resilience] Simulate timeout and verify safe retry behavior
- [Negative] Permission revoked mid-flow and verify access denied

## Output Notes (Test Case Shape)
- `type`: usually `negative` or `performance`/`resilience` depending on taxonomy
- `expected`: must mention integrity ("no duplicate", "no partial save")
- `coverageTags`: include `error-guessing`
