---
id: requirements-to-tests-traceability
title: Requirements to Tests Traceability
tags: [technique, traceability, documentation]
version: 1.0
---

## Intent
Keep test cases linked to requirements so coverage is auditable and changes can be assessed quickly.

## When to Use
- Always, especially with uploaded requirement docs

## Method
1. Split requirements into referenceable units:
   - headings/sections (e.g., "2.3 Password policy")
   - numbered bullets
   - line references (when extracted from text)
2. For each test case, add `requirementRefs` pointing to the most relevant units.
3. If a requirement is ambiguous, record it as:
   - `assumptions` (what you assumed)
   - `missingInfoQuestions` (what you need answered)
4. Avoid 1 test covering many requirements; prefer atomic mapping.

## Traceability Quality Gates
- Every P0/P1 requirement has at least one test
- Every P0/P1 test references at least one requirement
- No test references contradictory requirements without a note

## Output Notes (Test Case Shape)
- `requirementRefs`: use stable identifiers (section numbers, headings, or extracted line numbers)
- `coverageTags`: include `traceability`
