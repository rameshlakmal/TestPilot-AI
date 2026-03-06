---
id: boundary-value-analysis
title: Boundary Value Analysis (BVA)
tags: [technique, boundary, inputs, validation]
version: 1.0
---

## Intent
Find defects near edges of allowed ranges by testing values at, just below, and just above boundaries.

## When to Use
- Numeric ranges (min/max)
- Length constraints (minLength/maxLength)
- Dates/times (start/end, time windows)
- Pagination limits (page size, max results)
- File size limits

## Inputs Needed
- Range/limit definitions (explicit or inferred)
- Unit and precision (integer/decimal, timezone)
- Expected behavior on boundary violations (error, clamp, warning)

## Method
1. Identify boundary points for each constrained input.
2. Choose a standard boundary set:
   - Exactly at min, just above min
   - Exactly at max, just below max
   - Just below min, just above max (invalid)
3. Add special boundaries:
   - 0, 1, -1
   - Empty, null, whitespace
   - Large values (overflow), long strings
4. Convert into atomic test cases with explicit expected results.

## Boundary Checklist
- Min/max inclusive vs exclusive
- Precision/rounding (e.g., 2 decimals)
- Timezone and DST edges for time windows
- Off-by-one on lengths and list counts
- Performance boundaries (large payloads still succeed within limits)

## Scenario Templates
- [Boundary] Accept value at min
- [Boundary] Reject value just below min
- [Boundary] Accept value at max
- [Boundary] Reject value just above max
- [Boundary] Length exactly max and max+1
- [Boundary] Page size exactly max and max+1

## Output Notes (Test Case Shape)
- `title`: include boundary point (e.g., "Password length = max")
- `steps`: provide the exact test value
- `expected`: state acceptance/rejection and the correct feedback
- `coverageTags`: include `bva` plus the field/constraint

## Common Pitfalls
- Not defining boundary values precisely ("near max" is ambiguous)
- Forgetting inclusive/exclusive rules
- Confusing boundary failures with general invalid partitions (keep EP separate)
