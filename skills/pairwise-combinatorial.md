---
id: pairwise-combinatorial
title: Pairwise / Combinatorial Testing
tags: [technique, combinations, inputs, efficiency]
version: 1.0
---

## Intent
Cover interactions between parameters efficiently by generating a minimal set where every pair of parameter values appears at least once.

## When to Use
- Many inputs/filters that can be combined
- Environment matrices (browser/device/role)
- Config/flag combinations

## Inputs Needed
- Parameter list and possible values
- Constraints (invalid combos, dependencies)
- Risk notes (some pairs more important)

## Method
1. Define parameters and discrete value sets.
2. Add constraints (e.g., "Safari + FeatureX disabled" not applicable).
3. Generate pairwise set (algorithm/tool) or approximate manually for small sets.
4. Add targeted extra tests for:
   - High-risk values
   - Known problematic interactions
   - Boundaries (via BVA) on critical numeric fields

## Scenario Templates
- [Compatibility] Execute same scenario across pairwise env matrix
- [Functional] Combine filters pairwise and verify results

## Output Notes (Test Case Shape)
- `title`: mention the combination set id (e.g., "Pairwise set #3")
- `steps`: enumerate chosen values explicitly
- `coverageTags`: include `pairwise`

## Common Pitfalls
- Using pairwise for true rule logic (use decision tables for rules)
- Ignoring constraints and generating impossible tests
