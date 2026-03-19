---
id: state-transition
title: State Transition Testing
tags: [technique, workflow, states, functional, negative, modeling, diagram, guards]
version: 1.1
---

## Intent
Find defects in workflows by verifying allowed/blocked transitions between states and correct behavior when events occur in a given state.

This technique is most effective when behavior depends on sequence (stateful behavior), not just single inputs.

## When to Use
- Order lifecycles (Draft -> Submitted -> Approved -> Fulfilled)
- User/account status (Active/Suspended/Deleted)
- Async jobs (Queued/Running/Failed/Completed)
- Multi-step wizards

Strong signals:
- There is a status field (or mode) with explicit allowed transitions
- The same event behaves differently depending on current state
- Bugs require "a ridiculous set of clicks" / specific sequences to reproduce

## Inputs Needed
- State list and initial state
- Events/actions that trigger transitions
- Guard conditions (who can do what, when)
- Side effects per transition (notifications, timestamps)

Optional (but often necessary for real systems):
- Entry/exit actions per state (what happens on entering/leaving)
- In-state behavior (timers, background work)
- Terminal/final states and what is disallowed there
- Error handling and recovery expectations

## Method
1. Model the state machine.
   - States (include initial state; include terminal states)
   - Events (user actions, system events, timers, external callbacks)
   - Transitions: `event [guard] / effect` (guard/effect optional)
2. Build a diagram and/or a transition table.
   - Diagram is great for communication.
   - Table is great for completeness (every state x event combination is considered).
3. Generate tests.
   - Valid transitions: each allowed arrow.
   - Invalid transitions: events that must be rejected or be no-ops in a state.
   - Sequences (paths): critical business flows across multiple transitions.
   - Loops/retries: repeat the same event where applicable.
   - Start/end states: system starts in correct initial state; finishes in correct final state.
4. Verify actions/effects.
   - State change persisted.
   - Side effects occur exactly once and in the correct order.
   - No side effects occur on blocked transitions.
5. Validate persistence and recovery.
   - refresh/reload/re-fetch does not change state unexpectedly.
   - after error/timeout, system returns to a coherent state.
6. Add concurrency if relevant.
   - same event twice (idempotency)
   - two actors racing (locks, optimistic concurrency, last-write rules)

## Coverage Targets
- All states visited at least once
- All transitions covered at least once
- All invalid transitions attempted for high-risk states

If risk/size allows, add:
- All critical paths covered (end-to-end sequences)
- All guards exercised at least once (true/false)

## Scenario Templates
- [Functional] From state A, perform event E, verify state B and side effects
- [Negative] From state A, attempt event F (invalid), verify rejection and no side effects
- [Resilience] Retry event E twice, verify idempotent result
- [Sequence] Traverse A -> B -> C via E1 then E2, verify cumulative effects and invariants
- [Guard] From state A, attempt event E as unauthorized actor, verify blocked transition

## Output Notes (Test Case Shape)
- `title`: include "A -> B" (e.g., "Submitted -> Approved")
- `preconditions`: ensure starting state is explicit
- `steps`: include event name and any key inputs that act as guards
- `expected`: include final state, key persisted fields, and side effects (including "none" for blocked transitions)
- `coverageTags`: include `state-transition`, state names, and event name

## Common Pitfalls
- Not testing blocked transitions (only happy paths)
- Forgetting refresh/reload persistence checks
- Missing side effects (audit trail, timestamps)

Also common:
- Missing initial/terminal states (or treating them implicitly)
- Unreachable states or dead-end states not noticed until production
- Conflating UI screens with states (a screen can represent multiple states)
- Combinatorial explosion (testing all paths) without risk-based selection
- Diagrams/tables not kept in sync with changing requirements

## References
- GeeksforGeeks: "State Transition Testing" (2024). https://www.geeksforgeeks.org/software-engineering/state-transition-testing/
- testRigor: "What is State Transition Testing?" (2025). https://testrigor.com/blog/what-is-state-transition-testing/
- ScienceDirect Topics: "State Transition". https://www.sciencedirect.com/topics/computer-science/state-transition
