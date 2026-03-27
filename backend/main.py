"""
CompanyLens — FastAPI Application
Routes only — no business logic here.
"""

import sys
import os

# Ensure the backend directory is in Python's module search path
# (needed for Python 3.14 + uvicorn reloader subprocess)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
import uuid
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from models.schemas import (
    AnalyzeRequest, AnalyzeResponse, StatusResponse,
    ReportResponse, AgentStatuses, FinalReport
)
from orchestrator.graph import analysis_graph

# ─── Logging Setup ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)
logger = logging.getLogger(__name__)

# ─── App Init ────────────────────────────────────────────────────────
app = FastAPI(
    title="CompanyLens",
    description="Multi-Agent Due Diligence System — 3 AI agents analyze a company's legal, financial, and engineering health.",
    version="1.0.0",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://frontend-kohl-one-37.vercel.app",
        "https://frontend-6fjxn6mcc-anubhav-rajs-projects-19c63b2b.vercel.app",
        "https://companylensbyanubhav.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-Memory Job Store ────────────────────────────────────────────
# Rule: No database. Simple dict keyed by job_id.
jobs: dict[str, dict] = {}


# ─── Background Task Runner ─────────────────────────────────────────
async def run_analysis(job_id: str, company: str, github_org: Optional[str],
                       contract_bytes: Optional[bytes]):
    """Run the LangGraph analysis pipeline in the background."""
    try:
        jobs[job_id]["status"] = "running"
        logger.info(f"Job {job_id}: Starting analysis for {company}")

        # Build initial state
        initial_state = {
            "company_name": company,
            "github_org": github_org,
            "contract_bytes": contract_bytes,
            "job_id": job_id,
            "legal_result": None,
            "finance_result": None,
            "dev_result": None,
            "final_report": None,
            "status": "running",
            "agent_statuses": {
                "legal_scout": "pending" if contract_bytes else "skipped",
                "finance_analyst": "pending",
                "dev_scout": "pending" if github_org else "skipped",
            },
        }

        # Update job with initial agent statuses
        jobs[job_id]["agents"] = initial_state["agent_statuses"].copy()

        # Run the graph
        result = await analysis_graph.ainvoke(initial_state)

        # Store results — strip internal debug keys before saving (never expose raw_error to frontend)
        legal_result = result.get("legal_result")
        if isinstance(legal_result, dict):
            legal_result.pop("raw_error", None)

        jobs[job_id]["status"] = "complete"
        jobs[job_id]["agents"] = result.get("agent_statuses", jobs[job_id]["agents"])
        jobs[job_id]["legal_result"] = legal_result
        jobs[job_id]["finance_result"] = result.get("finance_result")
        jobs[job_id]["dev_result"] = result.get("dev_result")
        jobs[job_id]["final_report"] = result.get("final_report")

        logger.info(f"Job {job_id}: Analysis complete for {company}")

    except Exception as e:
        logger.error(f"Job {job_id}: Analysis failed — {e}")
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)


# ─── Endpoints ───────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_company(
    company: str = Form(...),
    github_org: Optional[str] = Form(None),
    contract_url: Optional[str] = Form(None),
    contract_file: Optional[UploadFile] = File(None),
):
    """
    Start a new company analysis.
    Accepts form data (for file uploads) or JSON.
    Returns a job_id for status polling.
    """
    job_id = str(uuid.uuid4())

    # Read contract file if uploaded
    contract_bytes = None
    if contract_file:
        contract_bytes = await contract_file.read()
        logger.info(f"Received contract PDF: {contract_file.filename} ({len(contract_bytes)} bytes)")

    # Create job entry
    jobs[job_id] = {
        "job_id": job_id,
        "company": company,
        "status": "started",
        "agents": {
            "legal_scout": "pending" if contract_bytes else "skipped",
            "finance_analyst": "pending",
            "dev_scout": "pending" if github_org else "skipped",
        },
        "legal_result": None,
        "finance_result": None,
        "dev_result": None,
        "final_report": None,
    }

    # Fire and forget — run analysis in background
    asyncio.create_task(run_analysis(job_id, company, github_org, contract_bytes))

    return AnalyzeResponse(job_id=job_id, status="started", estimated_seconds=45)


@app.post("/api/analyze/json", response_model=AnalyzeResponse)
async def analyze_company_json(request: AnalyzeRequest):
    """
    Alternative JSON endpoint for analysis (no file upload).
    """
    job_id = str(uuid.uuid4())

    jobs[job_id] = {
        "job_id": job_id,
        "company": request.company,
        "status": "started",
        "agents": {
            "legal_scout": "skipped",
            "finance_analyst": "pending",
            "dev_scout": "pending" if request.github_org else "skipped",
        },
        "legal_result": None,
        "finance_result": None,
        "dev_result": None,
        "final_report": None,
    }

    asyncio.create_task(run_analysis(job_id, request.company, request.github_org, None))

    return AnalyzeResponse(job_id=job_id, status="started", estimated_seconds=45)


@app.get("/api/status/{job_id}", response_model=StatusResponse)
async def get_status(job_id: str):
    """Get current status of an analysis job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    job = jobs[job_id]
    partial_results = {}
    if job.get("finance_result"):
        partial_results["finance_analyst"] = job["finance_result"]
    if job.get("dev_result"):
        partial_results["dev_scout"] = job["dev_result"]
    if job.get("legal_result"):
        partial_results["legal_scout"] = job["legal_result"]

    return StatusResponse(
        job_id=job_id,
        status=job["status"],
        agents=AgentStatuses(**job.get("agents", {})),
        partial_results=partial_results,
    )


@app.get("/api/report/{job_id}", response_model=ReportResponse)
async def get_report(job_id: str):
    """Get the final report for a completed analysis job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    job = jobs[job_id]

    if job["status"] != "complete":
        return ReportResponse(
            job_id=job_id,
            status=job["status"],
            report=None,
        )

    report = job.get("final_report")
    report_model = None
    if report:
        try:
            report_model = FinalReport(**report)
        except Exception:
            report_model = FinalReport(
                overall_score=report.get("overall_score", 5.0),
                recommendation=report.get("recommendation", "PROCEED WITH CAUTION"),
                executive_summary=report.get("executive_summary", ""),
                legal_summary=report.get("legal_summary"),
                financial_summary=report.get("financial_summary"),
                engineering_summary=report.get("engineering_summary"),
                red_flags=report.get("red_flags", []),
                green_flags=report.get("green_flags", []),
            )

    return ReportResponse(
        job_id=job_id,
        status=job["status"],
        report=report_model,
    )
