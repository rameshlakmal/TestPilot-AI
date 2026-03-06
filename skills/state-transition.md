---
id: state-transition
title: State Transition Testing
tags: [technique, workflow, states, functional, negative]
version: 1.0
---

## Intent
Find defects in workflows by verifying allowed/blocked transitions between states and correct behavior on events.

## When to Use
- Order lifecycles (Draft -> Submitted -> Approved -> Fulfilled)
- User/account status (Active/Suspended/Deleted)
- Async jobs (Queued/Running/Failed/Completed)
- Multi-step wizards

## Inputs Needed
- State list and initial state
- Events/actions that trigger transitions
- Guard conditions (who can do what, when)
- Side effects per transition (notifications, timestamps)

## Method
1. Model the state machine:
   - States
   - Events
   - Allowed transitions
   - Invalid transitions (should be rejected)
2. Create tests for:
   - Each allowed transition
   - Each invalid transition (attempt and verify rejection)
   - Loops/retries
   - Terminal states behavior
3. Validate persistence:
   - State is saved, restored, and consistent across refresh/reload
4. Add concurrency if relevant:
   - Same event twice (idempotency)
   - Two actors racing (lock/conflict)

## Coverage Targets
- All states visited at least once
- All transitions covered at least once
- All invalid transitions attempted for high-risk states

## Scenario Templates
- [Functional] From state A, perform event E, verify state B and side effects
- [Negative] From state A, attempt event F (invalid), verify rejection and no side effects
- [Resilience] Retry event E twice, verify idempotent result

## Output Notes (Test Case Shape)
- `title`: include "A -> B" (e.g., "Submitted -> Approved")
- `preconditions`: ensure starting state is explicit
- `expected`: include final state and side effects
- `coverageTags`: include `state-transition` and state names

## Common Pitfalls
- Not testing blocked transitions (only happy paths)
- Forgetting refresh/reload persistence checks
- Missing side effects (audit trail, timestamps)
