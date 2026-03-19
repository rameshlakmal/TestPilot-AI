---
id: non-functional-baseline
title: General Non-Functional Test Scenarios (Baseline)
tags: [general, non-functional, security, performance, accessibility, reliability, privacy, observability]
version: 1.1
---

## Intent
Provide a lightweight baseline of non-functional scenarios that commonly reveal real-world issues.

Goal: catch the most common production failures early (security regressions, slow/fragile UX, broken error handling, inaccessible flows).

## Use This Skill
- Include when requirements do not explicitly mention NFRs
- Mark tests as P1/P2 unless the feature is high risk (auth, payments, PII)

Escalate to P0 when:
- AuthZ/AuthN boundaries are involved
- Money movement, irreversible actions, or legal/compliance constraints exist
- The feature is a critical path (signup, checkout, core workflow)

## Scenario Catalog

### Security (Baseline)
- Access control enforced server-side (not UI-only)
- Sensitive data not exposed in UI, logs, URLs, or error messages
- Rate limiting or abuse controls for high-risk endpoints (login, OTP, search)
- Authentication/session handling is safe:
  - session expiration is handled cleanly
  - logout invalidates session
  - cookies/tokens are not leaked via redirects or referer
- Injection defenses:
  - inputs are validated and safely handled (SQL/NoSQL/template injection)
  - user-controlled content is encoded on render (no reflected/stored XSS)
- CSRF protection for state-changing web requests (if cookie-based auth)
- Error handling does not reveal internals (stack traces, secrets, infrastructure IDs)
- File handling is safe (if uploads exist): type/size limits, malware scanning policy, path traversal protection

### Privacy and Compliance (Baseline)
- PII/PHI/credentials are not included in analytics events, logs, or support exports
- Data minimization: only necessary fields are collected and persisted
- Data retention/deletion behavior is honored (delete/archive/restore) when applicable
- Consent/notice flows do not block core functionality unexpectedly (if applicable)

### Performance (Baseline)
- Feature works under slow network (3G-like) without broken UI state
- Response time acceptable for common operations (note p95 target if known)
- Large dataset/page still usable (pagination, incremental load)
- Worst-case inputs remain usable:
  - long text, many list items, large payloads
  - expensive filters/search do not freeze the UI
- Client performance (if UI):
  - avoid long main-thread blocks on primary flows
  - skeleton/loading states appear quickly and do not flicker
- Server performance:
  - no N+1 query patterns on list/detail paths (if applicable)
  - caching does not serve cross-user/tenant data
- Basic load sanity (when relevant):
  - repeated actions at moderate concurrency do not time out or error

### Reliability/Resilience
- Timeout or transient failure yields safe error and allows retry
- No partial writes when a multi-step operation fails
- Retry does not create duplicates
- Degraded dependency behavior:
  - downstream outage returns a clear error and keeps data consistent
  - retries/backoff do not amplify failures or duplicate side effects
- Idempotency keys or equivalent protections work (when side effects exist)
- Crash-safe recovery:
  - refresh/reopen after failure restores a coherent state
  - background jobs (if any) can resume or fail safely

### Observability (Baseline)
- Failures are diagnosable:
  - errors include stable codes/messages for support
  - correlation/request IDs exist in logs/headers if the system supports them
- Metrics/alerts coverage exists for critical paths (at least success/failure/latency)
- Audit logs (if required) include actor, action, target, timestamp, and outcome

### Accessibility (Baseline)
- Keyboard navigation works for primary flow
- Labels and errors are associated to inputs
- Focus is visible and logical
- Screen reader basics:
  - headings/landmarks allow navigation
  - dynamic updates (toasts/errors/loading) are announced appropriately
- Visual accessibility:
  - sufficient color contrast for text and key controls
  - error states are not color-only

### Compatibility
- Responsive layout on mobile width
- Works on at least one Chromium browser and one non-Chromium (if web)
- Works with different viewport sizes and text scaling (200% if web)
- Time zone and locale formatting do not break critical flows (if dates/numbers displayed)
- If native/mobile: handles backgrounding/foregrounding without losing state

### Data Protection (Baseline)
- Backups/restore assumptions are documented for critical data (if applicable)
- Exports are permission-scoped and do not include hidden fields
- Secrets are never hardcoded in client-side bundles/config

## Output Notes
- If you cannot test a scenario due to missing info, emit it as a question/assumption.
- Use tags like `security-baseline`, `perf-baseline`, `a11y-baseline`, `reliability-baseline`.
- Prefer phrasing expected results as observable outcomes (UI state, API status, persisted state, logs/metrics if available).
