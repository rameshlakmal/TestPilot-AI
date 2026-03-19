---
id: risk-based-prioritization
title: Risk-Based Prioritization
tags: [technique, prioritization, planning, risk, rbt]
version: 1.1
---

## Intent
Assign test priority so teams run the most valuable tests first (smoke, then high-risk), using explicit risk signals instead of aiming for perfect coverage.

Risk-based testing (RBT) is the broader practice: identify risks, score them (likelihood x impact), design tests to mitigate them, execute in risk order, and continuously reassess.

## When to Use
- Always (especially when requirements are large)
- When delivery timelines require a minimal, high-value suite

Most valuable when:
- Time/resources are constrained
- The system is complex (many integrations, workflows, configs)
- Releases are frequent (CI/CD) and change risk is high

## Inputs Needed
- Business impact (money, privacy, uptime)
- Likelihood (complexity, change frequency, defect history)
- User exposure (how many users, how often used)
- Critical paths (checkout/login/data loss)

Optional but useful:
- Detectability (how likely we are to catch it before users do)
- Regulatory/compliance obligations (audit, safety, finance)
- Support/ops signals (incidents, customer complaints, error rates)

## Priority Scale (Suggested)
- P0: blocks core user journey; data loss; security/privacy; payment/auth; cannot ship
- P1: major feature broken; frequent workflow impacted; severe workaround
- P2: moderate impact; less frequent; acceptable workaround
- P3: cosmetic or rare edge; low impact

## Risk Scoring (Simple)
- Score each risk by **Impact** and **Likelihood**.
- Use a 1-3 or 1-5 scale; compute `riskScore = impact * likelihood`.

If you want a 3-factor score (more sensitive):
- `riskPriority = severity * likelihood * detectability` (FMEA-style), where higher means more risk.

Use scoring to rank areas; map the resulting rank to P0-P3.

## Risk Categories (Prompting List)
- Business: revenue loss, churn, reputational damage
- Security/Privacy: authz/authn, sensitive data exposure
- Operational: outages, degraded performance, recovery issues
- Technical: complexity, new tech, fragile integrations
- Compliance: regulatory failure, audit findings
- Project: tight timeline, unstable requirements, staffing gaps

## Method
1. Inventory what matters.
   - Top user journeys, critical data flows, irreversible actions, and integrations.
2. Identify risks.
   - Use requirement/design reviews, bug history, stakeholder input, and "what could go wrong" workshops.
3. Score risks.
   - Assign likelihood/impact (and optional detectability) and compute a risk score.
4. Map risks -> test coverage.
   - Ensure each high-risk item has at least one validating test (often multiple: happy path + key negatives).
5. Prioritize execution order.
   - Run tests by descending risk score; keep a minimum smoke set always green.
6. Allocate depth based on risk.
   - High risk: deeper functional + negative + resilience/security/perf as applicable.
   - Low risk: sanity checks and targeted spot tests.
7. Reassess continuously.
   - Update scores when code changes, new defects appear, incidents occur, or priorities shift.
8. Communicate risk clearly.
   - Present a simple risk quadrant (high/low impact vs high/low likelihood) and what is covered vs deferred.

## Output Notes (Test Case Shape)
- Set `priority` for every test
- Use `coverageTags` like `smoke-candidate`, `regression`, `automation`

Recommended additional fields/tags:
- `riskScore` or `riskLevel` (if your schema supports it)
- `riskCategory`: `security`, `business`, `operational`, `compliance`, `technical`
- `rationale`: one sentence explaining the impact and why it is prioritized

## Common Mistakes
- Scoring once and never updating (risk is dynamic)
- Only testing high-risk areas and ignoring baseline coverage entirely
- Using risk scoring to avoid uncomfortable conversations (risk needs explicit sign-off when deferred)
- Over-engineering the scoring model (keep it simple and repeatable)

## Metrics (Optional)
- Risk coverage: % of high-risk items with tests executed
- Escaped defects in high-risk areas
- Critical defects found per test-hour

## References
- Testomat: "Risk-Based Testing: Strategy, Approach & Real-World Examples". https://testomat.io/blog/risk-based-testing/
- Medium (QualityNexus): "Prioritize What Matters: How Risk-Based Testing Improves Product Quality". https://medium.com/qualitynexus/prioritize-what-matters-how-risk-based-testing-improves-product-quality-6cb11b83d8bf
- Tricentis: "A detailed guide to risk-based testing". https://www.tricentis.com/learn/risk-based-testing
- TestGuild: "Risk-Based Testing: Expert Guide". https://testguild.com/risk-based-testing/
