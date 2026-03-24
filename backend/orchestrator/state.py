"""
CompanyLens — LangGraph State Schema
Shared state TypedDict for the analysis pipeline.
"""

from typing import TypedDict, Optional


class AnalysisState(TypedDict):
    """Shared state passed between all LangGraph nodes."""
    company_name: str
    github_org: Optional[str]
    contract_bytes: Optional[bytes]
    job_id: str

    # Agent outputs — populated as each agent completes
    legal_result: Optional[dict]
    finance_result: Optional[dict]
    dev_result: Optional[dict]
    final_report: Optional[dict]

    # Tracking
    status: str  # "running" | "complete" | "error"
    agent_statuses: dict  # {"legal_scout": "running", ...}
