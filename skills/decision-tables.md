---
id: decision-tables
title: Decision Tables
tags: [technique, rules, business-logic, functional]
version: 1.0
---

## Intent
Systematically test business rules by enumerating combinations of conditions and verifying the correct actions/outcomes.

## When to Use
- Pricing/discount rules
- Eligibility checks (role + status + thresholds)
- Feature flag matrices
- Workflow branching logic

## Inputs Needed
- List of conditions (boolean or categorized)
- Expected outcomes/actions for each rule
- Priority/precedence rules when multiple conditions apply

## Method
1. Extract conditions and actions from requirements.
2. Normalize conditions to clear values (Yes/No or categories).
3. Build a rule table:
   - Columns = rules
   - Rows = conditions + actions
4. Reduce:
   - Merge equivalent rules with same outcome
   - Remove impossible combinations (constraints)
5. Generate at least one test per remaining rule.

## Coverage Targets
- Each unique outcome occurs at least once
- Each condition value influences an outcome at least once
- Rule precedence is validated (tie-breakers)

## Scenario Templates
- [Functional] For each rule, set conditions to match and verify expected action
- [Negative] Use conflicting conditions to validate precedence
- [Negative] Use missing/unknown condition input and verify default behavior

## Output Notes (Test Case Shape)
- `title`: reference the rule (e.g., "Rule 3: VIP + cart>100 => 10%")
- `preconditions`: include configuration/flags
- `steps`: set each condition explicitly
- `expected`: assert exact outcome and side effects
- `coverageTags`: include `decision-table`

## Common Pitfalls
- Trying to cover all combinations when conditions are many (use pairwise for input combos; keep decision tables for true rule logic)
- Not capturing precedence/short-circuit behavior
