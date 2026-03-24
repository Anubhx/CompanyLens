"""
CompanyLens — LangGraph Orchestrator
State graph wiring all 3 agents → synthesiser → final report.
Compiled once at module level — never inside a request handler.
"""

import logging
from langgraph.graph import StateGraph, END
from orchestrator.state import AnalysisState
from agents.legal_scout import run_legal_scout
from agents.finance_analyst import run_finance_analyst
from agents.dev_scout import run_dev_scout
from orchestrator.synthesiser import run_synthesiser

logger = logging.getLogger(__name__)


# ─── Node Functions ─────────────────────────────────────────────────
# Each node receives the full state and returns ONLY the keys it updates.

async def finance_analyst_node(state: AnalysisState) -> dict:
    """Run the Finance Analyst agent."""
    company = state["company_name"]
    logger.info(f"[Graph] Finance Analyst node starting for: {company}")

    agent_statuses = dict(state.get("agent_statuses", {}))
    agent_statuses["finance_analyst"] = "running"

    result = await run_finance_analyst(company)

    agent_statuses["finance_analyst"] = "complete"
    return {
        "finance_result": result,
        "agent_statuses": agent_statuses,
    }


async def dev_scout_node(state: AnalysisState) -> dict:
    """Run the Dev Scout agent."""
    github_org = state.get("github_org")
    company = state["company_name"]
    logger.info(f"[Graph] Dev Scout node starting for org: {github_org}")

    agent_statuses = dict(state.get("agent_statuses", {}))

    if not github_org:
        agent_statuses["dev_scout"] = "skipped"
        result = await run_dev_scout(None, company)
    else:
        agent_statuses["dev_scout"] = "running"
        result = await run_dev_scout(github_org, company)
        agent_statuses["dev_scout"] = "complete"

    return {
        "dev_result": result,
        "agent_statuses": agent_statuses,
    }


async def legal_scout_node(state: AnalysisState) -> dict:
    """Run the Legal Scout agent."""
    contract_bytes = state.get("contract_bytes")
    company = state["company_name"]
    logger.info(f"[Graph] Legal Scout node starting for: {company}")

    agent_statuses = dict(state.get("agent_statuses", {}))

    if not contract_bytes:
        agent_statuses["legal_scout"] = "skipped"
        result = await run_legal_scout(None, company)
    else:
        agent_statuses["legal_scout"] = "running"
        result = await run_legal_scout(contract_bytes, company)
        agent_statuses["legal_scout"] = "complete"

    return {
        "legal_result": result,
        "agent_statuses": agent_statuses,
    }


async def synthesiser_node(state: AnalysisState) -> dict:
    """Run the Synthesiser to produce the final report."""
    company = state["company_name"]
    logger.info(f"[Graph] Synthesiser node starting for: {company}")

    result = await run_synthesiser(
        company=company,
        legal_result=state.get("legal_result"),
        finance_result=state.get("finance_result"),
        dev_result=state.get("dev_result"),
    )

    return {
        "final_report": result,
        "status": "complete",
    }


# ─── Build the Graph ────────────────────────────────────────────────

def build_graph() -> StateGraph:
    """
    Build and compile the LangGraph state graph.
    Flow: finance_analyst → dev_scout → legal_scout → synthesiser → END
    """
    graph = StateGraph(AnalysisState)

    # Add nodes
    graph.add_node("finance_analyst", finance_analyst_node)
    graph.add_node("dev_scout", dev_scout_node)
    graph.add_node("legal_scout", legal_scout_node)
    graph.add_node("synthesiser", synthesiser_node)

    # Define edges — sequential flow
    graph.set_entry_point("finance_analyst")
    graph.add_edge("finance_analyst", "dev_scout")
    graph.add_edge("dev_scout", "legal_scout")
    graph.add_edge("legal_scout", "synthesiser")
    graph.add_edge("synthesiser", END)

    return graph.compile()


# Compile once at module level
analysis_graph = build_graph()
logger.info("LangGraph analysis graph compiled successfully")
