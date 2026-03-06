# Work Plan: AI Test Scenario Generator Agent

## Overview
Build an AI agent that accepts requirements (as pasted text, uploaded files, or references to local markdown files like `@projects-section.md`) and generates:
- a structured analysis (what the requirement says, assumptions, and gaps)
- a formal test design using appropriate test design techniques
- PlantUML diagrams when useful
- BDD-style `.feature` scenarios with concrete test data

The plan intentionally treats "test techniques" as an extensible library (not a fixed list). The agent must work even when the best technique is not explicitly pre-listed.

---

## Problem Statement
Manual test design is slow, inconsistent, and often misses edge/risk cases. Testers must:
- interpret requirements that arrive in many formats
- pick suitable techniques (sometimes multiple techniques per requirement)
- create clear, traceable test artifacts

This agent automates most of that workflow while keeping outputs reviewable and auditable.

---

## Non-Goals (for v1)
- Auto-executing tests in CI/CD
- Guaranteeing domain correctness without human review when requirements are ambiguous

---

## Inputs The Agent Must Support

### 1) Plain text requirements
- Single user story, multiple bullet points, acceptance criteria, or mixed prose

### 2) Uploaded files
- `.txt`, `.md`, `.pdf`, `.docx`, `.html` (max 2 MB)

### 3) Jira user story import
Direct integration with Jira to import user stories as requirements:
- Select a Jira project from a dropdown
- Filter stories by **Epic**, **Sprint**, and **Status**
- Select individual stories via checkboxes
- Click "Use Selected" to fetch full story details and auto-advance to the Analyze step
- **Reactive sync**: toggling story checkboxes after import automatically updates the requirement text — no need to re-click "Use Selected"
- The AI always analyzes the current selection, so users can iteratively refine which stories to include

---

## Outputs
For each processed requirement (or requirement chunk), produce:

| Artifact | Format | Notes |
|---|---|---|
| Analysis Report | Markdown | Parsed requirement model + assumptions + open questions |
| Technique Plan | Markdown | Technique(s) chosen + why + coverage mapping |
| Test Design | Markdown tables | Partitions/boundaries/decision tables/state models/etc. |
| BDD Scenarios | `.feature` | Gherkin with concrete data |
| Traceability | Markdown table | Requirement -> design -> scenarios |
| PlantUML Source (optional) | `.puml` | Use-case/state/sequence/activity, as applicable |
| Rendered Diagrams (optional) | PNG | Render via kroki or local PlantUML if enabled |

---

## Test Technique Library (Extensible)

### Principle
The agent is not limited to a hardcoded list. Instead, it uses a "technique registry" that can be extended without changing core logic.

### Example technique categories to support
Black-box / specification-based:
- Equivalence Partitioning
- Boundary Value Analysis (incl. robust BVA)
- Decision Table Testing
- State Transition Testing
- Cause-Effect Graphing
- Classification Tree Method
- Pairwise / Combinatorial (e.g., IPOG-style generation)
- Use Case / Scenario-based testing
- Requirements-based coverage

Experience-based:
- Error Guessing
- Exploratory Testing charters (session-based)
- Checklist-based (domain checklists)

Risk/quality-oriented:
- Risk-based testing (prioritization + depth)
- Security-focused test ideas (authz/authn, input validation, OWASP-style checks)
- Performance test ideas (SLO/latency budgets, spike/soak)
- Accessibility checks (WCAG-inspired heuristics)

Data/API-oriented:
- CRUD matrix (entity x operation)
- Contract testing (schema, versioning, backward compatibility)
- Property-based test properties (invariants) where appropriate

Note: v1 can implement a subset as "first-class" generators, while still allowing the selector to recommend additional techniques and produce partial artifacts (e.g., high-level checklist) when full automation is not implemented yet.

### Technique registry design
Store techniques as data + templates, for example `agent/techniques/registry.yaml`:
- `id`, `name`, `signals` (what to look for in requirements)
- `when_to_use`, `when_not_to_use`
- `inputs_needed` (ranges, enums, states, rules, constraints)
- `artifact_templates` (table schemas to output)
- `diagram_types` (state/use-case/sequence/activity)
- `bdd_patterns` (scenario shapes)

The selector becomes "registry-driven": it matches requirement signals to techniques and picks 1..N techniques with ranked confidence.

---

## Agent Workflow (Pipeline)

```
[User Input: Text / File Upload / Jira Import]
   |
   v
Step 0: Input Processing
 - Accept paste/upload or Jira story import
 - Jira path: project → filter (epic/sprint/status) → select stories → auto-advance
 - Jira reactive sync: checkbox changes auto-update requirement text
 - Normalize into combined "requirement text"
   |
   v
Step 1: Requirement Analyzer (POST /api/analyze)
 - AI extracts testable elements: inputs, outputs, rules, states, boundaries, constraints
 - Recommends 3-6 testing techniques with confidence levels (high/medium/low)
 - Returns structured JSON: summary, extractedElements, techniqueRecommendations, complexity
   |
   v
Step 2: User Review & Configure
 - User toggles recommended techniques on/off (high+medium pre-checked)
 - Optionally selects Mermaid.js diagrams per technique
 - General Fallback skill always included as baseline
   |
   v
Step 3: Per-Skill Parallel Generation (POST /api/generate-tests)
 - Each selected technique gets a dedicated, focused LLM call
 - Up to 3 concurrent calls (1 for Gemini due to rate limits)
 - Each call receives: requirement + single skill markdown + extracted elements + depth guidance
 - Optional Mermaid diagram generated alongside test cases when selected
   |
   v
Step 4: Merge + Deduplicate
 - Extract diagrams before merge (preserved separately)
 - Merge all skill results into unified suite
 - Weighted Jaccard deduplication (title 40%, steps 40%, expected 20%, threshold 60%)
 - Renumber IDs: TC-001, TC-002, ...
 - Report duplicate groups to UI for transparency
   |
   v
[Output: Web UI + Export JSON/CSV + Push to Jira/AIO]
```

Alternative paths:
- **Path A (Preflight)**: Ask clarifying questions first via POST /api/preflight, then proceed to analysis

Clarifying questions policy:
- If critical inputs are missing (e.g., valid range not specified) the agent should:
  1) make conservative assumptions and label them, and
  2) list 3-5 targeted questions in the analysis report
The UI allows a follow-up loop where the user answers and the agent regenerates.

---

## How To Build An Agent With A Specific Skill Set

### What "skill" means here
A skill is a packaged capability that includes:
- an input contract (what it expects)
- a prompt/tooling recipe (how it reasons and what tools it may call)
- an output contract (schemas, file formats)
- an evaluation rubric (how we judge quality)

In this project, examples of skills:
- "Requirement Analysis"
- "Technique Routing"
- "Decision Table Generator"
- "Pairwise Generator"
- "Gherkin Scenario Writer"

### Skill architecture (recommended)
Use a modular, registry-driven design:
- `skills/` directory contains skill modules
- each skill exposes:
  - `name`, `version`, `supported_inputs`
  - `run(context) -> result`
  - `schemas` (Pydantic models) for input/output
  - `prompt templates` + few-shot examples
  - `unit tests` and golden test fixtures

Then add a small router that selects skills based on:
- requirement signals
- requested output types
- enabled capabilities (e.g., diagrams on/off)

What changes when you add a new skill:
- add a new skill module + its prompts/schemas
- register it (one line) in a central `skill_registry.py`
- add tests/fixtures
- no changes to the rest of the pipeline unless the skill introduces new artifact types

### Skill quality controls
- Deterministic schemas: force JSON outputs internally, then render to Markdown/feature files
- Golden tests: compare generated outputs for known inputs
- Rubric-based evaluation: completeness, correctness, traceability, readability

---

## User Interface (React + MUI)

3-step wizard with animated transitions, dark theme, purple accent (#a855f7).

Step 1 — Requirements:
- **Manual tab**: text area + file upload (drag-and-drop)
- **Jira tab**: project selector → epic/sprint/status filters → story checklist → "Use Selected" (auto-advances to Step 2)
- Jira stories stay reactively synced with checkboxes

Step 2 — Analyze & Configure:
- "Analyze & recommend techniques" button
- Technique cards with checkboxes (high+medium pre-checked)
- Optional Mermaid diagram selection per technique
- "Generate test scenarios" button

Step 3 — Results:
- Technique diagrams (collapsible Mermaid SVGs)
- Test case table with filter by type/priority, search, bulk select
- Duplicate groups viewer
- Export: JSON / CSV
- Push to AIO/Jira with folder hierarchy and priority mapping

---

## Project Structure (Proposed)

```
test-generator/
├── server/
│   ├── index.js                 # Express app, routes, orchestration
│   ├── prompt.js                # All prompt builders (analysis, per-skill, preflight)
│   ├── schema.js                # AJV JSON schemas (analysis, testSuite, preflight)
│   ├── util.js                  # JSON parsing, dedup, suite merging
│   ├── selectSkills.js          # Keyword-based skill selection (preflight fallback)
│   ├── skills.js                # Loads .md skill files from skills/ directory
│   ├── aio.js                   # AIO test management integration
│   ├── jira.js                  # Jira project/story import integration
│   └── llm/
│       ├── index.js             # Provider dispatcher
│       ├── openai.js            # OpenAI adapter
│       ├── anthropic.js         # Anthropic adapter
│       └── gemini.js            # Gemini adapter
├── client/
│   └── src/
│       ├── App.jsx              # Main shell: state, effects, orchestration, stepper UI
│       ├── StepRequirements.jsx # Step 1: provider/model, manual input, Jira import
│       ├── StepAnalyze.jsx      # Step 2: preflight, analysis, technique selection
│       ├── StepResults.jsx      # Step 3: test cases, filters, export, AIO push
│       ├── DiagramDialog.jsx    # Fullscreen Mermaid diagram viewer
│       ├── MermaidDiagram.jsx   # Mermaid.js diagram renderer with sanitization
│       ├── helpers.jsx          # Shared utility components and functions
│       ├── theme.js             # Theme constants, model options, diagram info
│       └── index.css            # Global styles, background gradients
├── skills/                      # 12 QA technique playbooks (.md with YAML front matter)
├── web/                         # Static files served by Express in production
├── .env.example                 # Environment variable template
└── package.json
```

---

## Technology Stack

| Component | Technology | Reason |
|---|---|---|
| Language | JavaScript (Node.js) | Full-stack JS, shared ecosystem |
| Backend | Express.js (CommonJS) | Lightweight, flexible routing |
| LLM Providers | OpenAI / Anthropic / Gemini | Multi-provider, avoid lock-in |
| Frontend | React + Material UI (Vite) | Rich component library, dark theme |
| Schema Validation | AJV (JSON Schema) | Strict contracts, LLM output repair |
| Diagrams | Mermaid.js (client-side) | No server dependency, interactive SVGs |
| Integration | Jira / AIO Test Management | Import stories, push test cases |

---

## Phased Build Plan (Detailed)

### Phase 1 - Scaffold + Contracts
- Create folder structure and base app shell
- Define Pydantic models for:
  - RequirementContext
  - RequirementModel (parsed fields)
  - TechniquePlan
  - TestDesign artifacts
  - BDDFeature output
- Add `input_resolver.py` with `@file` expansion + safe path handling

### Phase 2 - Skill Modules (MVP)
- Implement skills:
  - requirement analysis
  - technique routing (registry-driven)
  - EP/BVA design generator
  - decision table generator
  - state model generator
  - BDD writer
- Keep outputs schema-first: LLM returns JSON, then renderers produce Markdown/feature

### Phase 3 - Technique Registry Expansion
- Add registry entries for additional techniques (pairwise, cause-effect, checklists/charters)
- Implement pairwise generator (can be algorithmic, not LLM)
- Implement "recommend-only" output for techniques not fully automated yet

### Phase 4 - Diagrams
- PlantUML generators for:
  - use case (baseline)
  - state diagram (when states exist)
  - activity (for decision logic)
  - sequence (for multi-step flows)
- kroki renderer + caching

### Phase 5 - UI + Downloads
- Streamlit UI with:
  - paste/upload
  - preview of resolved `@files`
  - tabbed outputs
  - download zip

### Phase 6 - Validation + Regression Tests
- Add gherkin linter
- Add traceability checks
- Add golden fixtures (including one that uses `@projects-section.md` as input)
- Add basic load/latency constraints (timeouts, max tokens)

---

## Example Input (Including @file Reference)

```
Generate test scenarios for @projects-section.md
Focus on negative and edge cases.
```

Expected behavior:
- Agent loads `projects-section.md` content
- Extracts features (admin creates projects, sections, dataset download, self-completion)
- Chooses techniques (decision tables for permissions/rules, state transitions for completion, EP/BVA for dataset constraints, etc.)
- Outputs BDD scenarios with concrete datasets/roles/permissions

---

## Success Criteria
- [x] Supports pasted text, file uploads, and Jira story import
- [x] Jira import auto-advances to analysis, checkboxes reactively sync requirement text
- [x] AI-driven technique routing recommends 3-6 techniques with confidence levels
- [x] Per-skill parallel generation with focused LLM calls
- [x] Weighted Jaccard deduplication removes near-duplicate test cases
- [x] Mermaid.js diagrams render client-side for selected techniques
- [x] Export to JSON/CSV and push to AIO/Jira
- [ ] Golden fixtures exist for at least 5 representative requirement types
