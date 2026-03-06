---
id: equivalence-partitioning
title: Equivalence Partitioning (EP)
tags: [technique, inputs, validation, functional]
version: 1.0
---

## Intent
Reduce the number of tests by grouping inputs into classes (partitions) that are expected to behave the same, then test representative values from each class.

## When to Use
- Any field with rules (format, length, range, required/optional)
- APIs with parameter constraints
- Business rules with categories (roles, statuses, types)

## Inputs Needed
- Data elements (fields/parameters) and their constraints
- Valid/invalid criteria (from requirements or assumptions)
- System feedback expectations (messages, error codes)

## Method
1. List each input (field/parameter) and its constraints.
2. Create partitions for that input:
   - Valid partitions (should succeed)
   - Invalid partitions (should fail with specific feedback)
3. Pick 1-2 representatives per partition.
4. Combine across multiple inputs using:
   - One-factor-at-a-time for high-risk fields, or
   - Pairwise (see `pairwise-combinatorial.md`) to avoid explosion.
5. Turn representatives into atomic test cases.

## Partition Checklist
- Required vs optional vs conditionally required
- Empty vs null vs whitespace-only
- Correct type vs wrong type (string vs number vs object)
- Allowed set vs disallowed value
- Well-formed format vs malformed format (email/date/UUID)
- Encodings and locale (unicode, diacritics) if relevant

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
