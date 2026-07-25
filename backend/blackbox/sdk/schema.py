"""
BlackBox SDK — Data Schemas & Models
Pydantic models for runs, steps, tool calls, and eval results.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class ToolCall(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    result: Optional[Any] = None
    duration_ms: float = 0.0
    status: str = "success"  # success | error


class Step(BaseModel):
    step_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    run_id: str
    agent_name: str  # legal_scout | finance_analyst | dev_scout | orchestrator
    step_name: str
    step_type: str  # prompt | retrieval | tool_call | reasoning | response
    input_payload: Dict[str, Any] = Field(default_factory=dict)
    retrieved_context: Optional[List[Dict[str, Any]]] = None
    tool_calls: List[ToolCall] = Field(default_factory=list)
    output_payload: Optional[Any] = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost: float = 0.0
    latency_ms: float = 0.0
    status: str = "success"  # success | warn | error
    error_message: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class Run(BaseModel):
    run_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    company_name: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    status: str = "running"  # running | complete | error
    total_steps: int = 0
    total_latency_ms: float = 0.0
    total_tokens: int = 0
    total_cost: float = 0.0
    pass_score: Optional[float] = None
    eval_status: str = "unevaluated"  # unevaluated | pass | fail
    steps: List[Step] = Field(default_factory=list)


class GoldenTestCase(BaseModel):
    case_id: str
    agent_name: str
    category: str
    prompt: str
    expected_outcome: str
    expected_tools: Optional[List[str]] = None
    expected_keywords: Optional[List[str]] = None
    eval_rubric: str


class EvalResult(BaseModel):
    eval_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_id: str
    agent_name: str
    run_id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    status: str  # pass | fail
    score: float  # 0.0 to 1.0
    faithfulness_score: float = 1.0
    relevance_score: float = 1.0
    completeness_score: float = 1.0
    judge_reasoning: str
    latency_ms: float = 0.0
    cost: float = 0.0
