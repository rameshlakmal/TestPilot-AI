---
id: risk-based-prioritization
title: Risk-Based Prioritization
tags: [technique, prioritization, planning]
version: 1.0
---

## Intent
Assign test priority so teams run the most valuable tests first (smoke, then high-risk), without needing perfect coverage.

## When to Use
- Always (especially when requirements are large)
- When delivery timelines require a minimal, high-value suite

## Inputs Needed
- Business impact (money, privacy, uptime)
- Likelihood (complexity, change frequency, defect history)
- User exposure (how many users, how often used)
- Critical paths (checkout/login/data loss)

## Priority Scale (Suggested)
- P0: blocks core user journey; data loss; security/privacy; payment/auth; cannot ship
- P1: major feature broken; frequent workflow impacted; severe workaround
- P2: moderate impact; less frequent; acceptable workaround
- P3: cosmetic or rare edge; low impact

## Method
1. Identify top user journeys and failure consequences.
2. Map each test case to impact/likelihood.
3. Ensure minimum suites:
   - Smoke: all P0 happy paths + a few P0 negatives
   - Regression: P0+P1 across critical modules
4. Add notes for automation candidates (stable, repeatable).

## Output Notes (Test Case Shape)
- Set `priority` for every test
- Use `coverageTags` like `smoke-candidate`, `regression`, `automation`
