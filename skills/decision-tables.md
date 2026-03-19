---
id: decision-tables
title: Decision Tables
tags: [technique, rules, business-logic, functional]
version: 1.1
---

## Intent
Systematically test business rules by enumerating combinations of conditions and verifying the correct actions/outcomes.

## Table Anatomy (Terms)
- **Condition stubs**: the list of conditions (inputs) being evaluated.
- **Action stubs**: the list of possible actions/outcomes.
- **Condition entries**: the values of conditions per rule (often `T/F`, categories, or `0/1/~`).
- **Action entries**: which actions occur for a rule (often `X` / blank).
- **Rules**: columns; each column is one logical test situation.

## Types
- **Limited-entry**: each condition is binary (e.g., `T/F`, `0/1`).
- **Extended-entry**: one or more conditions have 3+ alternatives (categories).
- **Condition-action / rule-based**: general form mapping condition combinations to one or more actions.
- **Switch-style**: a single controlling condition drives mutually exclusive actions.

## When to Use
- Pricing/discount rules
- Eligibility checks (role + status + thresholds)
- Feature flag matrices
- Workflow branching logic
- Complex calculations with many decision points

## Inputs Needed
- List of conditions and their allowed values (boolean or categorized)
- Constraints between conditions (impossible combinations)
- Expected outcomes/actions (including side effects)
- Rule evaluation semantics: mutually exclusive vs overlap, and any precedence / tie-breakers ("first match", "highest priority", etc.)
- Default behavior for missing/unknown values

## Method
1. Extract conditions and actions from requirements.
2. Normalize conditions to clear values (Yes/No or explicit categories); prefer positive phrasing.
3. List **condition alternatives** (e.g., `member: yes/no`, `cartTotal: <=100/>100`, `payment: direct-debit/card/cash`).
4. Build the decision table:
   - Columns = rules (logical test situations)
   - Rows = conditions + actions
   - Use `-` / `~` for "don't care" when a condition does not affect a rule's outcome.
5. Complete the table for all combinations you consider in-scope.
6. Reduce safely:
   - Mark and keep **Not possible** / unexecutable combinations (document why)
   - Merge rules that differ only by don't-care conditions and have identical actions
7. Convert each remaining rule to at least one test case.
8. Translate logical rules to physical test data (choose representative values per category; apply EP/BVA for ranged conditions).

## Coverage Targets
- **Rule coverage**: each non-impossible column is tested at least once.
- **Action/outcome coverage**: each action occurs at least once.
- **Condition-alternative coverage**: each condition value (or category) appears in at least one executed test.
- **Precedence/hit policy coverage**: overlapping rules resolve as specified.

## Scenario Templates
- [Functional] For each rule, set conditions to match and verify expected action
- [Negative] Use conflicting conditions to validate precedence
- [Negative] Use missing/unknown condition input and verify default behavior
- [Consistency] Ensure "Not possible" combinations cannot be constructed via UI/API (or are rejected with correct errors)

## Output Notes (Test Case Shape)
- `title`: reference the rule (e.g., "Rule 3: VIP + cart>100 => 10%")
- `preconditions`: include configuration/flags
- `steps`: set each condition explicitly
- `expected`: assert exact outcome and side effects
- `coverageTags`: include `decision-table`

## Practical Tips
- Keep tables small: if you exceed ~5 conditions, split into smaller tables or factor shared logic.
- When filling many binary conditions, consider a systematic column order (e.g., Gray-code) to ease test creation and review.
- For multi-valued conditions, either split into several boolean conditions or treat each category as an explicit alternative.

## Common Pitfalls
- Trying to cover all combinations when conditions are many (use pairwise for input combos; keep decision tables for true rule logic)
- Not capturing precedence / hit policy (especially when more than one rule could apply)
- Leaving conditions vague ("valid user") instead of explicit alternatives
- Omitting constraints, causing tests for impossible situations or missing required validation
- Mixing "rule logic" with pure data-range testing (handle ranges with EP/BVA, then plug representative values into rules)

## References
- https://www.geeksforgeeks.org/software-engineering/decision-table-based-testing-in-software-testing/
- https://katalon.com/resources-center/blog/decision-table-testing-guide
- https://www.browserstack.com/guide/decision-table
- https://www.tmap.net/wiki/decision-table-test-dtt/
