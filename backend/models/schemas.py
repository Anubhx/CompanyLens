"""
CompanyLens — Pydantic Models
All request/response schemas for API endpoints and agent outputs.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Agent Output Schemas ───────────────────────────────────────────

class LegalResult(BaseModel):
    risk_level: str = Field(description="LOW | MEDIUM | HIGH")
    red_flags: list[str] = Field(default_factory=list)
    ip_terms: str = ""
    payment_terms: str = ""
    termination_terms: str = ""
    non_compete: str = ""
    summary: str = ""


class FinanceResult(BaseModel):
    health_score: int = Field(ge=1, le=10)
    funding_stage: str = ""
    last_funding: str = ""
    layoff_risk: str = Field(default="LOW", description="LOW | MEDIUM | HIGH")
    glassdoor_rating: Optional[float] = None
    headcount_trend: str = Field(default="STABLE", description="GROWING | STABLE | SHRINKING")
    signals: list[str] = Field(default_factory=list)
    summary: str = ""


class DevResult(BaseModel):
    eng_score: int = Field(ge=1, le=10)
    activity_level: str = Field(default="MEDIUM", description="HIGH | MEDIUM | LOW")
    top_languages: list[str] = Field(default_factory=list)
    open_source_culture: str = Field(default="MODERATE", description="STRONG | MODERATE | MINIMAL")
    pr_velocity: str = Field(default="NORMAL", description="FAST | NORMAL | SLOW")
    highlights: list[str] = Field(default_factory=list)
    summary: str = ""


class FinalReport(BaseModel):
    overall_score: float = Field(ge=0, le=10)
    recommendation: str = Field(description="GOOD TO PROCEED | PROCEED WITH CAUTION | DO NOT PROCEED")
    executive_summary: str = ""
    legal_summary: Optional[dict] = None
    financial_summary: Optional[dict] = None
    engineering_summary: Optional[dict] = None
    red_flags: list[str] = Field(default_factory=list)
    green_flags: list[str] = Field(default_factory=list)
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


# ─── API Request/Response Schemas ───────────────────────────────────

class AnalyzeRequest(BaseModel):
    company: str = Field(description="Company name to analyze")
    github_org: Optional[str] = Field(default=None, description="GitHub org name (optional)")
    contract_url: Optional[str] = Field(default=None, description="URL to contract/ToS (optional)")


class AnalyzeResponse(BaseModel):
    job_id: str
    status: str = "started"
    estimated_seconds: int = 45


class AgentStatuses(BaseModel):
    legal_scout: str = "pending"
    finance_analyst: str = "pending"
    dev_scout: str = "pending"


class StatusResponse(BaseModel):
    job_id: str
    status: str
    agents: AgentStatuses = Field(default_factory=AgentStatuses)
    partial_results: dict = Field(default_factory=dict)


class ReportResponse(BaseModel):
    job_id: str
    status: str
    report: Optional[FinalReport] = None
