---
id: feature-decomposition
title: Feature Decomposition (Universal Fallback)
tags: [technique, analysis, decomposition, planning]
version: 1.0
---

## Intent
Turn an unfamiliar feature into testable dimensions by extracting actors, data, rules, states, and integrations. Use this when no domain-specific skill matches.

## When to Use
- New/unknown domain features
- Vague requirements
- "One-off" features that do not fit existing playbooks

## Method
1. Identify actors and permissions:
   - who uses it, roles, ownership rules
2. Identify objects and data:
   - entities, fields, validations, identifiers, uniqueness
3. Identify actions and outcomes:
   - create/read/update/delete, submit/approve/cancel, import/export
4. Identify rules:
   - conditions, thresholds, constraints, defaults
5. Identify states/workflow:
   - lifecycle states, allowed transitions, terminal states
6. Identify integrations and side effects:
   - external services, notifications, audit logs, events
7. Identify non-functional expectations:
   - latency, reliability, accessibility, compatibility, security
8. Convert each dimension into tests using EP/BVA/decision tables/state transitions.

## Output Notes
- Always produce:
  - a small happy-path set
  - targeted negatives (validation, permission, duplicate actions)
  - assumptions + missing-info questions
- Use `coverageTags` like `decomposition` and include dimension tags (actor, rule, state, integration)
