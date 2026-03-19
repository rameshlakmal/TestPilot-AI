---
id: error-guessing-heuristics
title: Error Guessing Heuristics
tags: [technique, negative, resilience, exploratory]
version: 1.1
---

## Intent
Generate high-yield test ideas (often negative/edge/resilience) using experience-driven heuristics: common failure patterns, past defects, and "where this is likely to break" intuition.

## What It Is (And Isn't)
- Error guessing is an informal black-box technique: tests are derived from tester intuition, domain knowledge, and defect history, not from a formal model.
- Heuristics are fallible, context-sensitive rules of thumb; treat them as prompts, not guarantees.
- The goal is discovery and risk reduction, not exhaustive coverage.

## When to Use
- Ambiguous requirements
- Complex integrations
- Areas with many historical defects
- Late-stage / pre-release "what did we miss?" passes
- Legacy systems with weak documentation
- Recently changed code (regression risk)

## Inputs Needed
- Recent changes (PRs, release notes) and known-risk areas
- Defect history (bug tracker themes, "chronic" failures)
- User journeys and misuse/abuse cases
- System observability: logs, metrics, audit trails, DLQ, retries
- Failure policy: what "safe failure" means (rollback, idempotency, rate limits)

## Heuristic Catalog (Turn Into Tests)
- **Input handling**: missing/empty/null/whitespace; wrong type; unexpected encoding; copy-paste junk; unsupported file types
- **Size/extremes**: very long strings; many items; large payloads; high/low numeric extremes; precision/rounding quirks
- **Special characters**: quotes, separators, newlines, RTL markers, URL-encoding, unicode normalization differences
- **Injection/sanitization**: SQL/LDAP/XSS/template injection probes; path traversal; header injection (for APIs)
- **Sequence/user behavior**: double-click/duplicate submit; refresh/back; open same flow in two tabs; cancel mid-flight
- **Timing & clocks**: timeouts; retries; DST/timezone edges; client clock skew; expiration windows
- **Concurrency**: stale reads after writes; optimistic lock conflicts; race conditions; out-of-order events
- **Network**: slow/spotty; offline mid-operation; retries with partial responses; mobile background/foreground
- **Partial failure**: one of multiple calls fails; saga/compensation; retries create duplicates
- **Permissions**: role changes during session; token expiry/refresh; tenant boundary leakage
- **Caching**: stale caches after write; CDN/proxy cache surprises; eventual consistency
- **External dependencies**: email/SMS/payment down; webhook failures; rate limits; third-party schema changes
- **State/data integrity**: no partial writes; correct rollback; idempotency keys honored; duplicate prevention

## Oracles (How You Recognize a Problem)
Use these as "is this suspicious?" prompts when specs are missing.
- **Consistency/history**: behavior matches prior versions unless intentionally changed
- **Comparable products/claims**: matches docs, marketing claims, and similar workflows
- **User expectations**: errors are understandable; recovery is possible
- **Standards/statutes**: format and compliance expectations are met

## Method
1. Choose a focus area using a simple prompt (e.g., recent/core/risky/config/repair/chronic).
2. Brainstorm 5-15 candidate tests from the catalog; prefer "high impact + likely".
3. For each test idea, define:
   - Trigger condition (the odd input or stressful situation)
   - Oracle (why you think this could fail)
   - Expected behavior (error/retry/rollback/compensation)
   - Integrity expectation (no duplicates, no partial save, no privilege escalation)
4. Execute and observe: UI response, API status, logs, side effects, data changes.
5. Document what you tried (inputs + environment + results) so it is repeatable.
6. Promote confirmed high-value checks into regression (automated or scripted) when stable.

## Scenario Templates
- [Negative] Double-submit and verify single record created
- [Resilience] Simulate timeout and verify safe retry behavior
- [Negative] Permission revoked mid-flow and verify access denied
- [Security] Probe input sanitization and verify safe handling
- [Data Integrity] Induce partial failure and verify rollback/compensation

## Common Pitfalls
- Treating heuristics as a universal checklist (context matters)
- Letting biases steer you (availability bias: only test what you recently saw fail)
- Not writing down what you tried (hard to reproduce/share)
- Confusing "we found nothing" with "it's safe" (coverage is not measurable here)

## Output Notes (Test Case Shape)
- `type`: usually `negative` or `performance`/`resilience` depending on taxonomy
- `expected`: must mention integrity ("no duplicate", "no partial save")
- `coverageTags`: include `error-guessing`

## References
- https://testrigor.com/blog/what-is-error-guessing-technique/
- https://www.ministryoftesting.com/articles/ce0dc29c?s_id=1474072
- https://www.linkedin.com/pulse/heuristics-testing-mirage-simplicity-reality-depth-brijesh-deb-h0uce/
