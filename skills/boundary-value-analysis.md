---
id: boundary-value-analysis
title: Boundary Value Analysis (BVA)
tags: [technique, boundary, inputs, validation]
version: 1.1
---

## Intent
Find defects near edges of allowed ranges by testing values at, just below, and just above boundaries.

## Relationship to Equivalence Partitioning
- Equivalence Partitioning (EP) groups inputs into valid/invalid classes.
- BVA targets the edges between those classes (common sources of off-by-one and comparison bugs like `>` vs `>=`).

## When to Use
- Numeric ranges (min/max)
- Length constraints (minLength/maxLength)
- Dates/times (start/end, time windows)
- Ordered sets with endpoints (e.g., list count, page size, retry limits)
- Pagination limits (page size, max results)
- File size limits

## Inputs Needed
- Range/limit definitions (explicit or inferred)
- Unit and precision (integer/decimal, timezone)
- Inclusive vs exclusive rules (e.g., `min` included? `max` included?)
- Expected behavior on boundary violations (error, clamp, warning)

## Core Boundary Sets
- **Standard BVA (single input):** `min`, `min+1`, `max-1`, `max` plus 1 nominal in-range value.
- **Robust BVA (single input):** Standard BVA plus invalid edges `min-1` and `max+1`.
- **Multiple inputs:**
  - Prefer **one-factor-at-a-time** (vary one input to its boundary values while keeping others at nominal values).
  - Only use **worst-case combinations** when interactions are likely (combinatorics grow quickly).

## Method
1. Identify each constrained input and its valid/invalid equivalence classes.
2. For each class boundary, list the exact edge values (at / just inside / just outside).
3. Pick a boundary set (Standard or Robust) and define the step size for "just inside/outside" (often `1` for integers, or the smallest meaningful unit for decimals/time).
4. Hold non-target inputs at nominal values; vary one input per test unless interaction is suspected.
5. Convert selections into atomic test cases with explicit expected results (accept/reject + message + stored value).

## Boundary Checklist
- Min/max inclusive vs exclusive
- Precision/rounding (e.g., 2 decimals)
- Timezone and DST edges for time windows
- Off-by-one on lengths and list counts
- Performance boundaries (large payloads still succeed within limits)
- Interactions (one field changes another field's limits)

## Scenario Templates
- [Boundary] Accept value at min
- [Boundary] Reject value just below min
- [Boundary] Accept value at max
- [Boundary] Reject value just above max
- [Boundary] Length exactly max and max+1
- [Boundary] Page size exactly max and max+1

## Quick Examples
- **Age 18-60 (inclusive):** `17, 18, 19, 59, 60, 61` (Robust-style edges); keep other fields nominal.
- **Password length 8-64:** `7, 8, 9, 63, 64, 65` plus representative valid content checks (not just length).
- **Date window [start,end]:** test equality (`start`, `end`), just outside by the smallest unit used by the system (e.g., 1 second), and DST transitions if relevant.

## Output Notes (Test Case Shape)
- `title`: include boundary point (e.g., "Password length = max")
- `steps`: provide the exact test value
- `expected`: state acceptance/rejection and the correct feedback
- `coverageTags`: include `bva` plus the field/constraint

## Common Pitfalls
- Not defining boundary values precisely ("near max" is ambiguous)
- Forgetting inclusive/exclusive rules
- Confusing boundary failures with general invalid partitions (keep EP separate)
- Missing non-boundary invalids (e.g., type/format errors) that EP should cover

## References
- https://katalon.com/resources-center/blog/boundary-value-analysis-guide
- https://www.geeksforgeeks.org/software-testing/software-testing-boundary-value-analysis/
