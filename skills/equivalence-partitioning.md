---
id: equivalence-partitioning
title: Equivalence Partitioning (EP)
tags: [technique, inputs, validation, functional]
version: 1.1
---

## Intent
Reduce the number of tests by grouping inputs into classes (partitions) that are expected to behave the same, then test representative values from each class.

## Relationship to Boundary Value Analysis
- EP gives broad coverage of "kinds of inputs".
- Boundary Value Analysis (BVA) targets values at the *edges* between partitions; use both for ranged inputs.

## When to Use
- Any field with rules (format, length, range, required/optional)
- APIs with parameter constraints
- Business rules with categories (roles, statuses, types)
- Large input domains where exhaustive testing is impossible

## Inputs Needed
- Data elements (fields/parameters) and their constraints
- Valid/invalid criteria (from requirements or assumptions)
- System feedback expectations (messages, error codes)
- Constraints/coupling between fields (when one input changes another input's valid domain)

## Partition Types (Common Patterns)
- **Range (continuous or integer)**: typically 1 valid partition + 2 invalid partitions (below min, above max).
- **Enumerations/sets**: valid set(s) + invalid (not-in-set) partition(s).
- **Format-based**: well-formed partition(s) + specific malformed partitions (missing `@`, invalid TLD, bad checksum, etc.).
- **Requiredness**: present vs missing; distinguish `null` vs empty string vs whitespace when it matters.
- **Type**: correct type vs wrong type (string/number/object/array).
- **Boolean flags**: usually both `true` and `false` are valid partitions; invalids are missing/null/wrong-type.

## Method
1. List each input (field/parameter) and its constraints.
2. Create partitions for that input:
    - Valid partitions (should succeed)
    - Invalid partitions (should fail with specific feedback)
3. Pick 1 representative per partition (add a 2nd only if risk/complexity warrants it).
4. Combine across multiple inputs using:
    - One-factor-at-a-time for high-risk fields, or
    - Pairwise (see `pairwise-combinatorial.md`) to avoid explosion.
5. Turn representatives into atomic test cases with explicit expected outcomes.
6. For ranged partitions, add BVA cases at each boundary (`min-1, min, min+1, max-1, max, max+1`) as needed.

## Partition Checklist
- Required vs optional vs conditionally required
- Empty vs null vs whitespace-only
- Correct type vs wrong type (string vs number vs object)
- Allowed set vs disallowed value
- Well-formed format vs malformed format (email/date/UUID)
- Encodings and locale (unicode, diacritics) if relevant
- Default/"unknown" category behavior (e.g., unsupported enum value)
- Server/client normalization (trim, case-folding, locale-aware parsing)

## Quick Examples
- **Age 18-60 (inclusive)**
  - Valid: `[18..60]` (e.g., 25)
  - Invalid: `<18` (e.g., 17), `>60` (e.g., 61), wrong type (e.g., `"abc"`)
- **Discount tiers (transaction amount)**
  - Invalid: `<$1`, `>$3500`
  - Valid partitions per tier: `$1..$150`, `$151..$250`, `$251..$3500`
- **Email**
  - Valid: well-formed address
  - Invalid: missing `@`, missing domain, forbidden characters, over-length

## Coverage Targets
- Each partition has at least one executed test (valid + each invalid)
- Each distinct error message/code is asserted at least once
- For multi-input rules: each high-impact partition appears in at least one combination (use pairwise or isolate)

## Scenario Templates
- [Functional] Accept representative values from each valid partition
- [Negative] Reject values from each invalid partition with correct error
- [Negative] Required field missing/empty/whitespace-only
- [Negative] Unexpected type provided (API/JSON)

## Output Notes (Test Case Shape)
For each test case, provide:
- `title`: mention the partition (e.g., "Email - invalid format partition")
- `steps`: include the representative value
- `expected`: include exact validation outcome (UI message or API error)
- `coverageTags`: include `ep` plus the field name

## Common Pitfalls
- Mixing boundary testing into EP (keep boundaries in BVA)
- Creating too-broad partitions ("invalid" is not specific enough)
- Combining every partition across every field (use pairwise or isolate)
- Assuming all values in a partition behave identically when hidden special-cases exist (work with domain experts; add targeted tests when risk is high)

## References
- https://www.geeksforgeeks.org/software-engineering/equivalence-partitioning-method/
- https://testgrid.io/blog/equivalence-partitioning-testing/
- https://www.tutorialspoint.com/software_testing_dictionary/equivalence_partitioning_testing.htm
- https://katalon.com/resources-center/blog/equivalence-class-partitioning-guide
