---
id: pairwise-combinatorial
title: Pairwise / Combinatorial Testing
tags: [technique, combinations, inputs, efficiency, constraints, n-wise]
version: 1.1
---

## Intent
Cover interactions between parameters efficiently by generating a small set of test cases where every pair of parameter values appears at least once (pairwise / all-pairs).

This is a test design technique for combinations, not a substitute for functional rule testing.

## When to Use
- Many inputs/filters that can be combined
- Environment matrices (browser/device/role)
- Config/flag combinations

Best fit:
- Many discrete parameters with mostly independent values
- You want broad interaction coverage quickly (smoke/regression)

Avoid / augment when:
- Defects are likely to require 3+ parameters interacting (consider 3-wise / n-wise)
- The feature is a rules engine with complex branching logic (use decision tables)
- There are heavy constraints that eliminate most combinations (pairwise may collapse)

## Inputs Needed
- Parameter list and possible values (discrete)
- Constraints (invalid combos, dependencies, mutual exclusivity)
- Risk notes (high-impact values, historically flaky pairs)
- Execution cost notes (which combos are expensive/slow)

If you have continuous inputs (numbers/dates): discretize first using EP/BVA (e.g., min, min+1, typical, max-1, max).

## Method
1. Define parameters and discrete value sets.
   - Prefer values that actually change behavior (not cosmetic variants).
2. Validate value quality.
   - Ensure each value is testable, meaningful, and distinct.
3. Add constraints.
   - Exclude impossible combinations (platform limits, role restrictions, feature dependencies).
4. Generate the set.
   - Use a pairwise generator (recommended) for anything non-trivial.
   - For high-risk systems, consider 3-wise or higher.
5. Review and refine.
   - Confirm all pairs are covered and constraints are respected.
   - Remove redundant parameters/values that do not affect outcomes.
6. Add targeted extras (risk-based augmentation).
   - Boundary cases on numeric/date inputs (BVA)
   - High-risk values (auth, payments, data loss)
   - Known problematic interactions (from bug history)
   - One or two "popular real-world" combos (top traffic)

## Orthogonal Arrays and N-wise
- Pairwise is often implemented using orthogonal arrays / combinatorial algorithms to reduce test count while preserving pair coverage.
- Generalization is n-wise testing (3-wise, 4-wise, ...): increases coverage for multi-factor interaction defects at the cost of more tests.

## Tools (Common)
- PICT: supports constraints and weighting
- ACTS (NIST): supports pairwise and higher-order (3-wise, n-wise) with constraint management
- AllPairs: lightweight all-pairs generator
- Hexawise / similar: UI-driven generation with optimization, constraints, and prioritization

If you generate in a tool, save the model (parameters/values/constraints) alongside the test suite so it can be regenerated.

## Best Practices
- Prioritize parameters that are most likely to interact (or have produced bugs before).
- Use constraints aggressively to avoid wasted execution on impossible combinations.
- Combine with EP/BVA and targeted negatives (pairwise alone does not cover boundary failures).
- Document assumptions and keep the matrix updated as values/flags/platforms evolve.

## Scenario Templates
- [Compatibility] Execute the same core scenario across a pairwise environment matrix (browser x device x OS x role).
- [Functional] Combine filters/options pairwise and verify results set, counts, and ordering rules.
- [Config] Toggle feature flags/settings pairwise and verify behavior changes only when expected.
- [Config] Toggle feature flags/settings pairwise and verify no crashes on rare combinations.

## Minimal Example (Parameter Matrix)

Parameters:
- Role: `admin`, `member`, `guest`
- Browser: `chrome`, `firefox`, `safari`
- Payment: `card`, `paypal`, `bank`

Pairwise output is a small table of rows where each pair (e.g., `guest+safari`, `paypal+firefox`) appears at least once.

## Output Notes (Test Case Shape)
- `title`: mention the combination set id (e.g., "Pairwise set #3")
- `steps`: enumerate chosen values explicitly
- `coverageTags`: include `pairwise` plus the parameter names (e.g., `role`, `browser`, `flag`)
- Keep one test case per generated row; attach the row as explicit test data
- If a row is blocked by constraints at runtime, record it and regenerate (do not silently drop coverage)

## Common Pitfalls
- Using pairwise for true rule logic (use decision tables for rules)
- Choosing too many low-signal parameters/values (bloats set without increasing meaningful coverage)
- Ignoring constraints and generating impossible tests
- Treating pairwise as "complete" coverage (it can miss 3-way defects)
- Forgetting to update the matrix when requirements/flags/platforms change

## References
- TestRail: "Pairwise Testing Explained with Tools & Examples" (2026). https://www.testrail.com/blog/pairwise-testing/
- GeeksforGeeks: "Pairwise Software Testing" (2019). https://www.geeksforgeeks.org/software-engineering/pairwise-software-testing/
- Inflectra: "Pairwise Testing: What It Is, Examples, & More" (2025). https://www.inflectra.com/Ideas/Topic/What-is-Pairwise-Testing.aspx
