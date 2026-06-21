# Antigravity Autonomous Web Agent Monorepo

An intelligent, autonomous website automation agent (a mini-version of tools like "Browser Use") built within a high-performance **TypeScript Monorepo** architecture. The agent acts autonomously, navigating web pages, identifying elements through a **Linearized Accessibility Tree**, making actions via pixel coordinates, and persistence logging inside **PostgreSQL** using **Drizzle ORM**.

---

## 🚀 Key Features

*   **Sense-Think-Act Loop:** Continuous loop mapping observation, evaluation, and precise coordinate actuation.
*   **Coordinate-Based Action Tools:** Clicks and keyboard events occur strictly via calculated pixel coordinates ($(x, y)$ centers).
*   **Linearized Accessibility Tree Parser:** Extracts only visible and interactive elements, avoiding context-heavy HTML bloating.
*   **Drizzle ORM & PostgreSQL:** Structured logging for high-level agent runs and granular execution actions.
*   **Sleek Dashboard:** React Dashboard visualizing step thoughts, DB records, and captured viewport snapshots in real-time.

---

## 📂 Monorepo Architecture

```text
genai/
├── package.json                 # Monorepo workspaces configuration
├── turbo.json                   # Turborepo build/dev pipelines
├── docker-compose.yml           # Local PostgreSQL container definition
├── apps/
│   ├── agent/                   # TypeScript browser agent service (Playwright + Gemini 1.5 Flash)
│   └── web/                     # React Vite console dashboard
└── packages/
    ├── database/                # Shared DB schemas and pooling client (Drizzle + pg Pool)
    └── tsconfig/                # Base TSConfig rules
```

---

## 🔧 Prerequisites

*   **Node.js:** `v18.0.0` or higher
*   **Docker:** For spinning up the local PostgreSQL database
*   **Gemini API Key:** For powering the agent's decision engine

---

## 🛠️ Getting Started & Setup

### 1. Install Dependencies
Install all monorepo dependencies and link packages using npm workspaces:
```bash
npm install
```

### 2. Start PostgreSQL via Docker
In the root directory, spin up the local PostgreSQL container:
```bash
docker-compose up -d
```

### 3. Setup Environment Variables
Create a `.env` file inside `apps/agent/` (copying the structure from `.env.example`):
```bash
cp apps/agent/.env.example apps/agent/.env
```
Open `apps/agent/.env` and insert your Gemini API Key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
DATABASE_URL=postgresql://postgres:password@localhost:5432/genai
```

### 4. Push Database Schemas
Generate and push the Drizzle schema directly to your running PostgreSQL container:
```bash
npm run db:push
```

### 5. Running the Application
Start the React frontend and packages in development mode:
```bash
npm run dev
```
The React Dashboard console will be accessible at: `http://localhost:3000`.

---

## 🧠 Architectural Insights: Accessibility Tree vs. Raw HTML

Traditional browser automation agents scrape raw HTML, which has major limitations:
1.  **Context Window Bloating:** Even simple landing pages can exceed 50,000 lines of HTML code. Dumping this raw text consumes massive amounts of LLM context tokens and introduces latency.
2.  **Element Overlap & Visibility Blindness:** An element can be in the HTML DOM but hidden behind dynamic modals, style configurations (`display: none`), or offset viewports.
3.  **Selector Fragility:** Hardcoded CSS selectors break with any styling framework modifications.

### Our Solution: Linearized Accessibility Tree
Our custom locator script (`detector.ts`) evaluates the active viewport:
*   Filters out non-interactive tags, zero-size objects, and offscreen coordinate coordinates.
*   Resolves labels using accessible priority: `aria-label` ➔ `placeholder` ➔ `innerText` ➔ `id` ➔ `name`.
*   Calculates center-coordinate coordinates $(x, y)$ dynamically.
*   Passes an ultra-lightweight list to **Gemini 1.5 Flash**, keeping token costs low and decision speed extremely high.

---

## 📚 Documentation & Verification

For more details on setting up, developing, and deploying the monorepo packages, please see:
*   [System Architecture Guides](./docs/architecture.md) — Technical details on the Sense-Think-Act loop.
*   [REST API Contracts](./docs/api-contracts.md) — Endpoint schemas for agent/dashboard coordination.
*   [Troubleshooting Guide](./docs/troubleshooting.md) — Fixing common connection, docker, or playwright issues.
*   [Database Package Seeding](./packages/database/README.md) — Setting up local test records for debugging.
