---
id: non-functional-baseline
title: General Non-Functional Test Scenarios (Baseline)
tags: [general, non-functional, security, performance, accessibility, reliability]
version: 1.0
---

## Intent
Provide a lightweight baseline of non-functional scenarios that commonly reveal real-world issues.

## Use This Skill
- Include when requirements do not explicitly mention NFRs
- Mark tests as P1/P2 unless the feature is high risk (auth, payments, PII)

## Scenario Catalog

### Security (Baseline)
- Access control enforced server-side (not UI-only)
- Sensitive data not exposed in UI, logs, URLs, or error messages
- Rate limiting or abuse controls for high-risk endpoints (login, OTP, search)

### Performance (Baseline)
- Feature works under slow network (3G-like) without broken UI state
- Response time acceptable for common operations (note p95 target if known)
- Large dataset/page still usable (pagination, incremental load)

### Reliability/Resilience
- Timeout or transient failure yields safe error and allows retry
- No partial writes when a multi-step operation fails
- Retry does not create duplicates

### Accessibility (Baseline)
- Keyboard navigation works for primary flow
- Labels and errors are associated to inputs
- Focus is visible and logical

### Compatibility
- Responsive layout on mobile width
- Works on at least one Chromium browser and one non-Chromium (if web)

## Output Notes
- If you cannot test a scenario due to missing info, emit it as a question/assumption.
- Use tags like `security-baseline`, `perf-baseline`, `a11y-baseline`, `reliability-baseline`.
