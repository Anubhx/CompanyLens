# CompanyLens 🔍

**Multi-Agent Due Diligence System** — 3 AI agents analyze a company's legal contracts, financial health, and engineering reputation in parallel, producing a structured due-diligence report in ~60 seconds.

![Built with](https://img.shields.io/badge/Built_with-LangGraph-6366f1?style=flat-square) ![AI](https://img.shields.io/badge/AI-Gemini_API-8b5cf6?style=flat-square) ![Backend](https://img.shields.io/badge/Backend-FastAPI-10b981?style=flat-square) ![Frontend](https://img.shields.io/badge/Frontend-Next.js_14-000?style=flat-square)

---

## Architecture

```
User Input → FastAPI → LangGraph Orchestrator
                         ├── 📋 Legal Scout (RAG over contracts)
                         ├── 📊 Finance Analyst (Tavily web search)
                         └── 💻 Dev Scout (GitHub API)
                                    ↓
                         Report Synthesiser (Gemini LLM)
                                    ↓
                         Next.js Dashboard UI
```

## The 3 Agents

| Agent | Input | What it does |
|-------|-------|-------------|
| **Legal Scout** | Contract PDF | RAG pipeline — embeds contract chunks, retrieves relevant clauses, identifies red flags |
| **Finance Analyst** | Company name | Web search via Tavily — funding, layoffs, revenue signals, Glassdoor |
| **Dev Scout** | GitHub org | GitHub API — commit activity, languages, stars, open source culture |
| **Synthesiser** | All outputs | Single Gemini call — produces final score, recommendation, and executive summary |

## Tech Stack

- **Orchestration:** LangGraph (state graph, sequential agent execution)
- **LLM:** Google Gemini API (free tier)
- **Backend:** FastAPI, async background tasks, Pydantic models
- **RAG:** ChromaDB (in-memory) + Gemini Embeddings
- **Search:** Tavily API
- **Frontend:** Next.js 14, Tailwind CSS, TypeScript
- **HTTP:** httpx (async)

## Quick Start

### 1. Clone & Setup Backend

```bash
cd companylens/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up API keys
cp .env.example .env
# Edit .env with your keys:
#   GEMINI_API_KEY=  (from aistudio.google.com — free)
#   TAVILY_API_KEY=  (from tavily.com — free 1000/month)
#   GITHUB_TOKEN=    (from github.com/settings/tokens — free)
```

### 2. Run Backend

```bash
cd companylens/backend
source venv/bin/activate
uvicorn main:app --reload
# API at http://localhost:8000
```

### 3. Run Frontend

```bash
cd companylens/frontend
npm install
npm run dev
# UI at http://localhost:3000
```

### 4. Test It

```bash
# Health check
curl http://localhost:8000/health

# Start analysis
curl -X POST http://localhost:8000/api/analyze/json \
  -H "Content-Type: application/json" \
  -d '{"company": "Stripe", "github_org": "stripe"}'

# Poll status (use job_id from above)
curl http://localhost:8000/api/status/{job_id}

# Get report
curl http://localhost:8000/api/report/{job_id}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/analyze` | Start analysis (form data + file upload) |
| POST | `/api/analyze/json` | Start analysis (JSON body) |
| GET | `/api/status/{job_id}` | Poll agent progress |
| GET | `/api/report/{job_id}` | Get final report |

## Project Structure

```
companylens/
├── backend/
│   ├── main.py              # FastAPI routes
│   ├── config.py             # Env vars
│   ├── agents/
│   │   ├── legal_scout.py    # RAG-based contract analysis
│   │   ├── finance_analyst.py # Web search + LLM
│   │   └── dev_scout.py      # GitHub API + LLM
│   ├── orchestrator/
│   │   ├── state.py          # LangGraph state schema
│   │   ├── graph.py          # State graph definition
│   │   └── synthesiser.py    # Final report generation
│   ├── tools/
│   │   ├── pdf_loader.py     # PyMuPDF PDF parsing
│   │   ├── search_tool.py    # Tavily wrapper
│   │   └── github_tool.py    # GitHub REST API
│   └── models/
│       └── schemas.py        # Pydantic models
├── frontend/
│   └── src/
│       ├── app/              # Next.js pages
│       ├── components/       # React components
│       └── lib/api.ts        # API client
└── README.md
```

---

*Built by Anubhav Raj · 2026*
