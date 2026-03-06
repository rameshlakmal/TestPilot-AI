# AI Test Case Generator

A skills-driven test case generation platform that uses AI to analyze software requirements and produce structured, high-quality test scenarios. Supports multiple LLM providers, 12 test design techniques, visual technique diagrams, and direct integration with Jira/AIO test management.

## Features

- **3-Step Wizard Flow** — Requirements → Analyze → Results with animated transitions
- **AI-Powered Analysis** — Extracts testable elements and recommends applicable test design techniques with confidence levels
- **12 Test Design Techniques** — Boundary Value Analysis, State Transition, Decision Tables, Equivalence Partitioning, Pairwise/Combinatorial, Error Guessing, Risk-Based Prioritization, Feature Decomposition, and more
- **Per-Skill Parallel Generation** — Each technique runs as a focused, dedicated LLM call for deeper coverage
- **3 LLM Providers** — OpenAI, Anthropic (Claude), Google Gemini — switch from the UI dropdown
- **Technique Diagrams** — Optional Mermaid.js visual diagrams showing how each technique applies to your requirement (state machines, flowcharts, mind maps)
- **Smart Deduplication** — Weighted Jaccard similarity removes near-duplicate test cases across techniques
- **Multiple Input Formats** — Paste text or upload PDF, DOCX, Markdown, TXT, HTML files
- **Clarify Requirements** — AI identifies ambiguities and asks targeted questions before generation
- **AIO/Jira Integration** — Push generated test cases directly to AIO Tests with folder hierarchy, priority mapping, and tag support
- **Export** — Download as JSON or CSV

## Quick Start

### Prerequisites

- **Node.js 18+** (20+ recommended)
- An API key for at least one provider:
  - [OpenAI API key](https://platform.openai.com/api-keys)
  - [Anthropic API key](https://console.anthropic.com/settings/keys)
  - [Google Gemini API key](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/rameshlakmal/Test-Scenario-Generator.git
cd Test-Scenario-Generator

# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### Configuration

Create a `.env` file in the project root (or copy the example):

```bash
cp .env.example .env
```

Add your API key(s):

```env
# At least one provider key is required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...

# Server settings (optional — defaults shown)
PORT=3001
LLM_TIMEOUT_MS=90000
MAX_TEST_CASES=160
MAX_UPLOAD_MB=2
RATE_LIMIT_PER_MINUTE=90

# CORS (optional — defaults to localhost:5173)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# AIO/Jira integration (optional)
# AIO_BASE_URL=https://tcms.aiojiraapps.com/aio-tcms
# AIO_TOKEN=your-aio-token
```

### Run (Development)

```bash
# Start both server and client with hot reload
npm run dev

# Or start them separately:
# Terminal 1 — Server
npm run dev:server
# Terminal 2 — Client
npm run dev:client
```

- Server: `http://localhost:3001`
- Client: `http://localhost:5173`

### Run (Production)

```bash
# Build the client
cd client && npm run build && cd ..

# Copy built files to the static directory
cp -r client/dist/* web/

# Start the server (serves both API and UI)
node server/index.js
```

Everything is served from `http://localhost:3001`.

## How It Works

### Workflow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  1. Requirements │ ──► │   2. Analyze      │ ──► │   3. Results    │
│                  │     │                   │     │                 │
│ • Paste text     │     │ • AI analyzes req │     │ • Test cases    │
│ • Upload file    │     │ • Recommends      │     │ • Technique     │
│ • Select provider│     │   techniques      │     │   diagrams      │
│ • Select model   │     │ • Select diagrams │     │ • Export/push   │
│ • Clarify (opt.) │     │ • Generate        │     │   to AIO        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Generation Paths

| Path | Description | Quality | Speed |
|------|-------------|---------|-------|
| **Analyze + Per-Skill** (recommended) | AI analyzes requirement, recommends techniques, generates per-skill in parallel | Highest | Moderate |
| **Legacy Mega-Prompt** | All 12 skills in one prompt, AI figures out which to apply | Lower | Fastest |

### Per-Skill Generation Flow

1. **Analyze** — AI reads the requirement, extracts testable elements (inputs, states, rules, boundaries), recommends 3-6 techniques
2. **Review** — User toggles techniques on/off, optionally selects which diagrams to generate
3. **Generate** — Each technique runs as a focused LLM call in parallel (up to 3 concurrent)
4. **Merge + Dedup** — Results combined, near-duplicates removed via weighted Jaccard similarity (40% title, 40% steps, 20% expected, threshold 60%)
5. **Results** — Renumbered test cases, technique diagrams, export options

### Technique Diagrams

Optional Mermaid.js diagrams visualize how each technique applies to your requirement:

| Technique | Diagram Type |
|-----------|-------------|
| State Transition | State Machine (`stateDiagram-v2`) |
| Decision Tables | Decision Flow (`flowchart TD`) |
| Equivalence Partitioning | Partition Ranges (`flowchart LR`) |
| Boundary Value Analysis | Boundary Points (`flowchart LR`) |
| Pairwise / Combinatorial | Combination Tree (`flowchart TD`) |
| Feature Decomposition | Mind Map (`mindmap`) |

Diagrams are opt-in per technique — no extra tokens consumed when not selected.

## Available Models

Models are selectable from the UI dropdown, defaulting to the best option per provider:

| Provider | Default Model | Other Options |
|----------|--------------|---------------|
| OpenAI | GPT-4.1 | GPT-4.1 Mini, GPT-4.1 Nano, GPT-4o, GPT-4o Mini |
| Anthropic | Claude Sonnet 4.5 | Claude Haiku 3.5 |
| Gemini | Gemini 2.5 Flash | Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash |

## Test Case Output

Each generated test case contains:

```json
{
  "id": "TC-001",
  "title": "Verify that login fails with invalid password",
  "type": "negative",
  "priority": "P0",
  "preconditions": ["User has a registered account"],
  "steps": ["Navigate to login page", "Enter valid email", "Enter invalid password", "Click Sign In"],
  "expected": ["Error message: 'Invalid credentials'", "User remains on login page"],
  "coverageTags": ["authentication", "boundary-value-analysis"],
  "requirementRefs": ["REQ-001"]
}
```

**Types:** functional, negative, boundary, security, accessibility, performance, usability, compatibility, resilience

**Priorities:** P0 (critical), P1 (high), P2 (medium), P3 (low)

## The 12 Skills

Skills are markdown playbooks in `skills/` that teach the AI how to apply each technique:

| Skill | Purpose |
|-------|---------|
| `equivalence-partitioning` | Group inputs into valid/invalid classes, test representatives |
| `boundary-value-analysis` | Test at edges of allowed ranges (min, max, off-by-one) |
| `decision-tables` | Enumerate condition combinations and verify outcomes |
| `state-transition` | Test allowed/blocked transitions between states |
| `pairwise-combinatorial` | Cover parameter interactions with minimal test sets |
| `error-guessing-heuristics` | Target common failure patterns and edge cases |
| `risk-based-prioritization` | Prioritize tests by business risk and failure impact |
| `requirements-to-tests-traceability` | Map requirements to test coverage |
| `feature-decomposition` | Break unknown features into testable dimensions |
| `functional-core` | Baseline happy path, validation, permissions, integrity |
| `non-functional-baseline` | Performance, security, accessibility, compatibility |
| `general-fallback` | Universal fallback — always included as baseline |

## AIO/Jira Integration

Push generated test cases to [AIO Tests](https://marketplace.atlassian.com/apps/1222843) (Jira test management):

1. Enter your **Jira project key** (e.g., `AT`)
2. Optionally specify a **folder path** (e.g., `Release 1.0 / Regression / Login`) — folders are auto-created
3. Enter your **AIO API token** (or configure `AIO_TOKEN` in `.env`)
4. Click **Create folder & push**

Each test case is created with priority mapping, step-by-step scripts, and optional coverage tags.

## Project Structure

```
test-generaror/
├── server/
│   ├── index.js                 # Express app, routes, orchestration
│   ├── prompt.js                # All prompt builders (analysis, per-skill, legacy, preflight)
│   ├── schema.js                # AJV JSON schemas (analysis, testSuite, preflight)
│   ├── util.js                  # JSON parsing, dedup, suite merging
│   ├── selectSkills.js          # Keyword-based skill selection (legacy fallback)
│   ├── skills.js                # Loads .md skill files from skills/ directory
│   ├── aio.js                   # Jira AIO integration
│   └── llm/
│       ├── index.js             # Provider dispatcher
│       ├── openai.js            # OpenAI adapter (structured output, json_schema)
│       ├── anthropic.js         # Anthropic adapter
│       └── gemini.js            # Gemini adapter (rate limit retry, schema fallbacks)
├── client/
│   └── src/
│       ├── App.jsx              # Main React + MUI app (3-step wizard)
│       └── MermaidDiagram.jsx   # Mermaid.js diagram renderer
├── web/                         # Static files served by Express
├── skills/                      # 12 QA technique playbooks (.md)
├── examples/                    # Example requirement documents
├── workflow.html                # Internal workflow documentation
├── .env.example                 # Environment variable template
└── package.json
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/skills` | GET | List loaded skills (id, title, tags) |
| `/api/preflight` | POST | Identify ambiguities and missing info in requirements |
| `/api/analyze` | POST | Analyze requirement, extract elements, recommend techniques |
| `/api/generate-tests` | POST | Generate test cases (per-skill or legacy mode) |
| `/api/aio/push` | POST | Push test suite to AIO/Jira |

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --production
RUN cd client && npm install && npm run build && cp -r dist/* ../web/ && cd ..
EXPOSE 3001
CMD ["node", "server/index.js"]
```

```bash
docker build -t test-generator .
docker run -d -p 3001:3001 -e OPENAI_API_KEY=sk-... --name test-generator test-generator
```

### PM2 (VPS)

```bash
npm install -g pm2
pm2 start server/index.js --name test-generator
pm2 save && pm2 startup
```

### Cloud Platforms

Works with Railway, Render, Fly.io, or any Node.js hosting:

- **Build command:** `cd client && npm install && npm run build && cp -r dist/* ../web/ && cd .. && npm install`
- **Start command:** `node server/index.js`
- **Environment variables:** Set via platform dashboard

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Express.js 5, Node.js 18+ |
| Frontend | React 19, Material UI 6, Vite 7 |
| Diagrams | Mermaid.js 11 |
| Validation | AJV (JSON Schema) |
| File Parsing | pdf-parse, mammoth (DOCX), cheerio (HTML) |
| LLM Providers | OpenAI, Anthropic, Google Gemini (REST APIs) |
| Styling | MUI dark theme with purple accent (#a855f7) |

## License

ISC
