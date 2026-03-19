---
id: feature-decomposition
title: Feature Decomposition (Universal Fallback)
tags: [technique, analysis, decomposition, planning, reconstruction]
version: 1.1
---

## Intent
Turn an unfamiliar feature into testable dimensions by extracting actors, data, rules, states, and integrations, then validate the breakdown by reconstructing an end-to-end slice. Use this when no domain-specific skill matches.

This skill borrows three complementary ideas from the literature:
- Decompose into feature subsets, build local models, then combine (Maimon/Rokach, 2002).
- Split representation into shared vs unique components, then reconstruct to enforce usefulness of the parts (Ruan et al., CVPR 2021).
- When decomposition is recomputed over time, watch for "drift" from mixing old and newly-decomposed outputs; prefer stepwise/point-local updates and track change points explicitly (Gan et al., Applied Energy 2025).

## When to Use
- New/unknown domain features
- Vague requirements
- "One-off" features that do not fit existing playbooks

Also useful when:
- The feature has many inputs/flags (high dimensionality) and you suspect irrelevant or interacting conditions.
- Requirements are evolving and you need a plan that stays stable under change.

## Principles
- Prefer partitions you can recombine: every part should contribute to a coherent end-to-end behavior.
- Separate shared vs variant-specific behavior: capture common flows once; isolate exceptions.
- Model both intra-part rules and inter-part interactions: some failures only show up at boundaries.
- If there are multiple outcomes (roles, platforms, workflows, time horizons), allow different subsets per outcome instead of forcing one global breakdown.
- Expect drift: if the inputs/state change over time (or as you learn more), keep a change log and re-validate reconstruction.

## Method
1. Identify actors and permissions:
   - who uses it, roles, ownership rules
2. Identify objects and data:
   - entities, fields, validations, identifiers, uniqueness
3. Identify actions and outcomes:
   - create/read/update/delete, submit/approve/cancel, import/export
4. Identify states/workflow:
   - lifecycle states, allowed transitions, terminal states
5. Identify rules (intra-dimension):
   - conditions, thresholds, constraints, defaults
6. Identify interactions (inter-dimension):
   - actor x state, rule x integration, concurrency/idempotency, ordering, retries
7. Identify integrations and side effects:
   - external services, notifications, audit logs, events
8. Identify non-functional expectations:
   - latency, reliability, accessibility, compatibility, security
9. Decompose into subsets you can own:
   - partition by responsibility (UI/API/DB), domain sub-areas, or independent feature flags
   - for each subset, define contract: inputs, outputs, invariants, error modes
10. Reconstruct a minimal end-to-end slice:
   - pick one "shared" happy path and one "unique" variant; ensure the parts compose cleanly
11. Convert each dimension into tests:
   - EP/BVA for data
   - decision tables for rules
   - state-transition tests for workflow
   - contract tests for subsets
   - pairwise interaction tests for boundaries

## Drift and Re-Decomposition
Use this when the decomposition changes as new info arrives (requirements, data shape, dependencies).
- Track change points: what changed, why, and which subset contracts are impacted.
- Avoid mixing incompatible decompositions: if a subset boundary or meaning changed, re-baseline tests that depended on it.
- Prefer stepwise updates: adjust the affected subset(s), then re-run reconstruction checks.

## Output Notes
- Always produce:
   - a small happy-path set
   - targeted negatives (validation, permission, duplicate actions)
   - reconstruction checks (end-to-end slice that composes the parts)
   - assumptions + missing-info questions
- Use `coverageTags` like `decomposition` plus dimension tags (actor, data, action, rule, state, integration, nonfunctional, interaction, reconstruction, drift)

## References
- Gan, Y. et al. "A stepwise decomposition and multi-label feature selection framework for carbon price forecasting amidst real-time data drift". Applied Energy, 2025. https://doi.org/10.1016/j.apenergy.2025.126824
- Ruan, D. et al. "Feature Decomposition and Reconstruction Learning for Effective Facial Expression Recognition". CVPR 2021. https://openaccess.thecvf.com/content/CVPR2021/papers/Ruan_Feature_Decomposition_and_Reconstruction_Learning_for_Effective_Facial_Expression_Recognition_CVPR_2021_paper.pdf
- Maimon, O., Rokach, L. "Improving Supervised Learning by Feature Decomposition". FoIKS 2002 (LNCS 2284). https://doi.org/10.1007/3-540-45758-5_12
