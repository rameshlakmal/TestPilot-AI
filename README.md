<div align="center">

<br/>

<img src="client/public/test-cases.png" width="80" alt="TestPilot AI Logo"/>

<br/>

# TestPilot AI

### Intelligent test design — from requirements to production-ready test cases in seconds.

<br/>

[![Node.js](https://img.shields.io/badge/Node.js_18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MUI](https://img.shields.io/badge/MUI_6-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

<br/>

**OpenAI** &nbsp;&middot;&nbsp; **Anthropic Claude** &nbsp;&middot;&nbsp; **Google Gemini** &nbsp;&middot;&nbsp; **Jira Import** &nbsp;&middot;&nbsp; **AIO Tests Export**

---

**12 QA techniques** &nbsp;&nbsp;|&nbsp;&nbsp; **Parallel AI generation** &nbsp;&nbsp;|&nbsp;&nbsp; **Smart deduplication** &nbsp;&nbsp;|&nbsp;&nbsp; **Visual technique diagrams**

<br/>

</div>

## Overview

TestPilot AI is an intelligent test case generation platform that uses AI to analyze software requirements and produce structured, high-quality test scenarios. It mirrors how a senior QA engineer thinks — analyze first, then apply the right testing techniques.

The UI is built as a 3-step wizard with a dark theme and purple accent, featuring collapsible configuration panels, inline status feedback, and a unified card-based layout across all stages.

---

## 3-Step Wizard Flow

<!-- Replace with Eraser.io generated diagram -->
<!-- DIAGRAM: 3-step-wizard-flow -->

| Step | Name | What Happens |
|------|------|-------------|
| **1** | **Requirements** | Provide input (write/upload/Jira), configure AI provider & model. Collapsible provider panel auto-hides when server-configured. Unified drag-drop + textarea with live word count. |
| **2** | **Analyze** | AI extracts testable elements, recommends techniques grouped by confidence (high/medium/low). Optional clarify step in a collapsible panel. Diagram selection as toggle chips. |
| **3** | **Results** | Summary stats with priority/type breakdown. Test case table with color-coded priorities, search & filters. Collapsible insights and AIO push sections. Export as PDF or CSV. |

---

## How It Works — The AI Pipeline

<!-- Replace with Eraser.io generated diagram -->
<!-- DIAGRAM: ai-pipeline -->

**Stage 1 — Analyze** (`POST /api/analyze`)
1. Extract testable elements (inputs, states, rules, boundaries, constraints, integrations)
2. Recommend QA skills with confidence scores (high / medium / low)
3. Assess complexity (simple / moderate / complex)

**User reviews & confirms** — toggle techniques on/off, select optional diagrams

**Stage 2 — Generate** (`POST /api/generate-tests`)
1. Run parallel LLM calls (max 3 concurrent), one per selected skill
2. Each skill gets its own focused prompt with the full requirement context
3. Merge all results into a single suite
4. Deduplicate using weighted Jaccard similarity (title 40% &middot; steps 40% &middot; expected 20%, threshold 60%)
5. Renumber and tag final test cases

---

## Architecture Overview

<!-- Replace with Eraser.io generated diagram -->
<!-- DIAGRAM: architecture -->

| Layer | Components |
|-------|-----------|
| **Client** | React 19 + MUI 6 + Vite &mdash; 3-step wizard (StepRequirements, StepAnalyze, StepResults), Mermaid.js diagrams, dark theme |
| **Server** | Express 5 + Node.js &mdash; Auth (JWT + Helmet + Rate Limit), Prompt Engine, Skill Loader, Schema Validator (Ajv), Merge + Dedup |
| **LLM Providers** | OpenAI (GPT-4.1), Anthropic (Claude), Google (Gemini) &mdash; switchable from UI |
| **Integrations** | Jira Cloud (import stories), AIO Tests (export cases) &mdash; server-configured or user-provided credentials |

---

## Features at a Glance

<!-- Replace with Eraser.io generated diagram -->
<!-- DIAGRAM: features-mindmap -->

### Multi-Provider AI
- OpenAI, Anthropic Claude, Google Gemini
- Switch from UI dropdown, auto-detect from API key prefix
- Server-configured keys auto-collapse the provider panel

### 12 QA Skill Playbooks
- Boundary Value Analysis, State Transition, Decision Tables, Equivalence Partitioning
- Error Guessing, Risk-Based Prioritization, Requirements Traceability
- Feature Decomposition, Functional Core, Non-Functional Baseline, Pairwise/Combinatorial
- General Fallback (always included as baseline)

### Smart Pipeline
- Parallel LLM calls (max 3 concurrent)
- Weighted Jaccard deduplication
- Confidence-grouped technique recommendations

### Modern UI/UX
- Single-card layout with collapsible sections across all stages
- Bordered accordion bars with chevron + hover states for clear expandability
- Inline success/error alerts for Jira connection and AIO push
- Drag-drop overlay on textarea, live word count, file type chips
- Color-coded priority chips (P0 red, P1 amber, P2 blue, P3 gray)
- Summary stats bar with priority and type breakdown

### Integrations
- Jira Cloud import (projects, epics, sprints, stories)
- AIO Tests export with folder hierarchies, priority mapping, coverage tags
- User-provided credentials when not server-configured (Base URL + Token fields)

### Export & Diagrams
- PDF export (landscape, color-coded priorities)
- CSV export
- Optional Mermaid technique diagrams (state machines, flowcharts, mindmaps)

### Security
- JWT Authentication with admin seed from env vars
- Helmet headers, rate limiting, CORS control

---

## QA Skills Library

12 expert playbooks in `skills/` that guide the AI like a test design handbook:

| # | Skill | What It Targets |
|---|-------|----------------|
| 1 | **Equivalence Partitioning** | Input domain classes — valid & invalid partitions |
| 2 | **Boundary Value Analysis** | Off-by-one, limits, edges of input ranges |
| 3 | **Decision Tables** | Complex business rules with multiple conditions |
| 4 | **State Transition** | Stateful workflows, lifecycle transitions |
| 5 | **Pairwise / Combinatorial** | Multi-parameter interactions, config combinations |
| 6 | **Error Guessing & Heuristics** | Common failure modes, past-bug patterns |
| 7 | **Risk-Based Prioritization** | High-impact, high-likelihood scenarios first |
| 8 | **Requirements Traceability** | Full requirement-to-test coverage mapping |
| 9 | **Feature Decomposition** | Breaking features into atomic testable units |
| 10 | **Functional Core** | Core happy-path and business logic validation |
| 11 | **Non-Functional Baseline** | Performance, security, usability baselines |
| 12 | **General Fallback** | Catch-all baseline — always included |

---

## Test Depth Modes

| Mode | Max Cases | Use Case |
|------|-----------|----------|
| **Smoke** | 30 | Quick sanity checks, CI gate validation |
| **Standard** | 120 | Sprint-level coverage, feature testing |
| **Deep** | 220 | Full regression suites, compliance audits |

---

## Test Case Output

Each generated test case is structured and atomic:

```json
{
  "id": "TC-001",
  "title": "Verify that login fails with invalid password",
  "type": "negative",
  "priority": "P0",
  "preconditions": ["User has a registered account"],
  "steps": [
    "Navigate to login page",
    "Enter valid email",
    "Enter invalid password",
    "Click Sign In"
  ],
  "expected": [
    "Error message: 'Invalid credentials'",
    "User remains on login page"
  ],
  "coverageTags": ["authentication", "boundary-value-analysis"],
  "requirementRefs": ["REQ-001"]
}
```

**Types:** `functional` &middot; `negative` &middot; `boundary` &middot; `security` &middot; `accessibility` &middot; `performance` &middot; `usability` &middot; `compatibility` &middot; `resilience`

**Priorities:** `P0` Critical &middot; `P1` High &middot; `P2` Medium &middot; `P3` Low

---

## Technique Diagrams

Optional Mermaid.js diagrams visualize how each technique applies to your requirement:

| Technique | Diagram Type | Visualization |
|-----------|-------------|---------------|
| State Transition | `stateDiagram-v2` | State machines with transitions |
| Decision Tables | `flowchart TD` | Decision flows with condition branches |
| Equivalence Partitioning | `flowchart LR` | Partition ranges and classes |
| Boundary Value Analysis | `flowchart LR` | Boundary points on value ranges |
| Pairwise / Combinatorial | `flowchart TD` | Combination trees |
| Feature Decomposition | `mindmap` | Feature hierarchy maps |

Diagrams are opt-in per technique and rendered as clickable chips in the Analyze stage.

---

## Available AI Models

Selectable from the UI dropdown (or auto-detected from API key prefix):

| Provider | Default Model | Other Options |
|----------|--------------|---------------|
| **OpenAI** | GPT-4.1 | GPT-4.1 Mini, GPT-4.1 Nano, GPT-4o, GPT-4o Mini, o3-mini, o4-mini |
| **Anthropic** | Claude Sonnet 4.5 | Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Haiku |
| **Gemini** | Gemini 2.5 Flash | Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash |

---

## Quick Start

### Prerequisites

- **Node.js 18+** (20+ recommended)
- An API key for at least one provider:
  [OpenAI](https://platform.openai.com/api-keys) &middot; [Anthropic](https://console.anthropic.com/settings/keys) &middot; [Google AI Studio](https://aistudio.google.com/apikey)

### Install & Run

```bash
# Clone
git clone https://github.com/rameshlakmal/Test-Scenario-Generator.git
cd Test-Scenario-Generator

# Install dependencies
npm install && cd client && npm install && cd ..

# Configure
cp .env.example .env
# Edit .env — add at least one API key

# Start (server + client with hot reload)
npm run dev
```

Open **http://localhost:5173** and start generating.

---

## Configuration

All settings live in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `openai` | Active provider: `openai`, `anthropic`, or `gemini` |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `PORT` | `3001` | Server port |
| `MAX_UPLOAD_MB` | `2` | Max file upload size (MB) |
| `MAX_TEST_CASES` | `160` | Hard cap on generated test cases |
| `LLM_TIMEOUT_MS` | `45000` | LLM request timeout (ms) |
| `RATE_LIMIT_PER_MINUTE` | `90` | API rate limit per minute |
| `CORS_ORIGINS` | `localhost:5173` | Allowed origins (comma-separated or `*`) |

<details>
<summary><strong>Jira Integration (Optional)</strong></summary>

```env
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=your-token
```

Enables the **Import from Jira** tab in Step 1 — browse projects, epics, sprints, and pull user stories directly. When not server-configured, users can enter credentials directly in the UI.

</details>

<details>
<summary><strong>AIO Tests Export (Optional)</strong></summary>

```env
AIO_BASE_URL=https://tcms.aiojiraapps.com/aio-tcms
AIO_TOKEN=your-token
```

Push generated test cases to [AIO Tests](https://marketplace.atlassian.com/apps/1222843) with auto-created folder hierarchies, priority mapping, and coverage tags. When not server-configured, users can enter AIO Base URL and API Token directly in the Results stage.

</details>

<details>
<summary><strong>Authentication (Optional)</strong></summary>

```env
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password
```

Seed an admin user on startup. JWT tokens protect all API routes except health check and auth endpoints.

</details>

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/providers` | List server-configured providers (LLM, Jira, AIO) |
| `GET` | `/api/skills` | List loaded QA skills |
| `POST` | `/api/validate-key` | Validate a user-provided API key |
| `POST` | `/api/models` | List available models for a provider |
| `POST` | `/api/preflight` | Identify ambiguities before generation |
| `POST` | `/api/analyze` | Analyze requirement, recommend techniques |
| `POST` | `/api/generate-tests` | Generate test suite (per-skill parallel) |
| `GET` | `/api/jira/status` | Check Jira connection status |
| `GET` | `/api/jira/projects` | List Jira projects |
| `GET` | `/api/jira/epics` | List epics for a project |
| `GET` | `/api/jira/sprints` | List sprints for a project |
| `GET` | `/api/jira/stories` | Search stories with filters |
| `POST` | `/api/jira/story-details` | Fetch full story details |
| `POST` | `/api/aio/push` | Export test cases to AIO Tests |

> All routes except `/api/health` and `/api/auth/*` require JWT authentication when configured.

---

## Project Structure

```
testpilot-ai/
|
+-- server/                         <- Express.js backend (CommonJS)
|   +-- index.js                    # Routes, orchestration, main entry
|   +-- prompt.js                   # Prompt builders (analysis, per-skill, legacy, preflight)
|   +-- schema.js                   # JSON schemas for validation (Ajv)
|   +-- util.js                     # JSON parsing, dedup, suite merging
|   +-- selectSkills.js             # Keyword-based skill selection (fallback)
|   +-- skills.js                   # Skill loader (parses markdown playbooks)
|   +-- auth.js                     # JWT authentication routes
|   +-- authMiddleware.js           # Route protection middleware
|   +-- jira.js                     # Jira Cloud API integration
|   +-- aio.js                      # AIO Tests export
|   +-- llm/
|       +-- index.js                # Provider router
|       +-- openai.js               # OpenAI adapter
|       +-- anthropic.js            # Anthropic Claude adapter
|       +-- gemini.js               # Google Gemini adapter
|
+-- client/                         <- React + Vite SPA (ESM)
|   +-- public/
|   |   +-- test-cases.png          # App logo
|   +-- src/
|       +-- App.jsx                 # Main shell, state, stepper orchestration
|       +-- StepRequirements.jsx    # Step 1: input, provider config, Jira import
|       +-- StepAnalyze.jsx         # Step 2: analysis, technique selection, diagrams
|       +-- StepResults.jsx         # Step 3: results, filters, export, AIO push
|       +-- LoginPage.jsx           # Authentication login page
|       +-- DiagramDialog.jsx       # Fullscreen Mermaid diagram viewer
|       +-- MermaidDiagram.jsx      # Mermaid.js renderer
|       +-- helpers.jsx             # Shared utility components (PDF, CSV, lists)
|       +-- theme.js                # Theme constants, model options, diagram info
|
+-- skills/                         <- 12 QA technique playbooks (.md)
|   +-- boundary-value-analysis.md
|   +-- equivalence-partitioning.md
|   +-- decision-tables.md
|   +-- state-transition.md
|   +-- ...
|
+-- web/                            <- Static vanilla JS UI (legacy)
+-- .env.example                    # Environment variable template
+-- package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Express.js 5, Node.js 18+, Ajv, JWT, Helmet |
| **Frontend** | React 19, Material UI 6, Vite 7 |
| **Diagrams** | Mermaid.js 11 |
| **AI Providers** | OpenAI, Anthropic Claude, Google Gemini |
| **Integrations** | Jira Cloud REST API, AIO Tests TCMS |
| **File Parsing** | pdf-parse, mammoth (DOCX), cheerio (HTML) |
| **Theme** | MUI dark theme with violet accent (`#a78bfa`) |

---

<div align="center">

<br/>

**Built so QA engineers can focus on thinking, not typing.**

<br/>

*Star the repo if this saves you time.*

</div>
