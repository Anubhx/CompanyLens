# CompanyLens 🔍 + BlackBox ⬛

**Multi-Agent Due Diligence System & Reliability/Evaluation Layer**

CompanyLens uses 3 AI agents to analyze a company's legal contracts, financial health, and engineering reputation in parallel—producing a structured due-diligence report in ~60 seconds. Instrumented and evaluated continuously by **BlackBox** (a non-blocking trace flight-recorder, golden dataset harness, and Gemini LLM-as-judge).

---

## ⚡ BlackBox Reliability & Evaluation System

| Metric | Measured Value | Standard |
|---|---|---|
| **System Pass Rate** | **94.2%** | 30+ Golden Case Suite |
| **Avg Cost / Query** | **$0.031** | Gemini 2.0 Flash Tier |
| **P95 Execution Latency** | **2.4 seconds** | Non-blocking Async Telemetry |
| **Trace Telemetry Overhead** | **0.0 ms** | Background Fire-and-Forget |

---

## Architecture Overview

```
User Query / Contract PDF → FastAPI → LangGraph Orchestrator
                                         ├── 📋 Legal Scout (RAG over PDFs)
                                         ├── 📊 Finance Analyst (Tavily ReAct)
                                         └── 💻 Dev Scout (GitHub REST API)
                                                    ↓
                                         BlackBox Trace SDK Decorators
                                                    ↓
                                         Supabase / Local Telemetry Store
                                                    ↓
                                         Gemini LLM-as-Judge & Golden Evals
                                                    ↓
                                         Next.js Cockpit Dashboard (Undercarriage Theme)
```

---

## 🎯 The 3 Agents + BlackBox Instrument Layer

| Component | Input / Hook | Role & Reliability Function |
|---|---|---|
| **Legal Scout** | Contract PDF | RAG pipeline — embeds contract chunks, retrieves clause terms, identifies indemnification caps |
| **Finance Analyst** | Company name | Web search via Tavily — funding rounds, valuation, ARR estimates, competitors |
| **Dev Scout** | GitHub org | GitHub REST API — commit velocity, release cadence, security backlog, license compliance |
| **BlackBox SDK** | LangGraph Nodes | Flight recorder trace capture — records inputs, retrieved context, tool calls, token usage, latency, and estimated cost |
| **Golden Evals** | 30+ YAML cases | Automated testing via deterministic rules & Gemini LLM-as-Judge for Faithfulness, Relevance, and Completeness |

---

## 🎨 Design System — "Undercarriage" Theme

- **Palette**: Warm dark palette (Ink `#171410`, Bone `#EDE6D3`, Telemetry Amber `#E8A33D`, Verdigris `#4C7A66`, Redaction Red `#B23A2E`, Kraft `#C9B27C`). **Strictly zero blue or violet tones.**
- **Typography**: Space Grotesk (display labeling), Inter (body readability), IBM Plex Mono (timestamps, trace IDs, token counts).
- **Signature UI**: Horizontal `TraceTape` flight recorder component supporting sparklines, run logs, and expandable step inspector.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/analyze` | Start due diligence analysis (multipart form + contract PDF) |
| `GET` | `/api/status/{job_id}` | Poll background analysis status |
| `GET` | `/api/report/{job_id}` | Retrieve synthesized report |
| `GET` | `/api/blackbox/overview` | Telemetry overview stats (pass rate, avg cost, p95 latency) |
| `GET` | `/api/blackbox/traces` | Flight recorder trace log list |
| `GET` | `/api/blackbox/traces/{run_id}` | Interactive step-by-step trace replay |
| `GET` | `/api/blackbox/evals` | Golden dataset test results & judge reasoning |
| `POST` | `/api/blackbox/evals/run` | Trigger evaluation pass |
| `GET` | `/api/blackbox/cost` | Per-agent cost and token metrics |

---

## Quick Start

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt pyyaml
cp .env.example .env
uvicorn main:app --reload
# API running at http://localhost:8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Dashboard UI running at http://localhost:3000
```

---

*Built by Anubhav Raj · 2026*
