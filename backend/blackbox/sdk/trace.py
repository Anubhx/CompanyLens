"""
BlackBox SDK — Trace Decorator and Helper Module
Wraps agent graph nodes and tool execution to capture flight-recorder telemetry.
"""

import time
import asyncio
import functools
import logging
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime

from blackbox.sdk.schema import Run, Step, ToolCall
from blackbox.sdk.client import blackbox_client

logger = logging.getLogger("blackbox.trace")

# Cost calculations per 1k tokens (Gemini 1.5/ Flash / Pro baseline estimates)
INPUT_COST_PER_1K = 0.000075  # ~$0.075 per 1M tokens
OUTPUT_COST_PER_1K = 0.000300  # ~$0.30 per 1M tokens

def estimate_tokens(text: str) -> int:
    """Rough estimation of token count from string length (1 token ~ 4 chars)."""
    if not text:
        return 0
    return max(1, len(text) // 4)

def calculate_cost(prompt_tokens: int, completion_tokens: int) -> float:
    return (prompt_tokens / 1000.0 * INPUT_COST_PER_1K) + (completion_tokens / 1000.0 * OUTPUT_COST_PER_1K)

class TraceSession:
    """Session tracker for a single CompanyLens multi-agent run."""

    def __init__(self, job_id: str, company_name: str):
        self.job_id = job_id
        self.company_name = company_name
        self.run = Run(
            job_id=job_id,
            company_name=company_name,
            status="running"
        )
        self._start_time = time.time()
        # Save initial run async
        asyncio.create_task(blackbox_client.save_run_async(self.run))

    async def record_step(
        self,
        agent_name: str,
        step_name: str,
        step_type: str,
        input_payload: Dict[str, Any],
        output_payload: Optional[Any] = None,
        retrieved_context: Optional[List[Dict[str, Any]]] = None,
        tool_calls: Optional[List[ToolCall]] = None,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        latency_ms: float = 0.0,
        status: str = "success",
        error_message: Optional[str] = None
    ) -> Step:
        total_tokens = prompt_tokens + completion_tokens
        cost = calculate_cost(prompt_tokens, completion_tokens)

        step = Step(
            run_id=self.run.run_id,
            agent_name=agent_name,
            step_name=step_name,
            step_type=step_type,
            input_payload=input_payload or {},
            retrieved_context=retrieved_context,
            tool_calls=tool_calls or [],
            output_payload=output_payload,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost=cost,
            latency_ms=latency_ms,
            status=status,
            error_message=error_message
        )

        self.run.steps.append(step)
        self.run.total_steps = len(self.run.steps)
        self.run.total_latency_ms += latency_ms
        self.run.total_tokens += total_tokens
        self.run.total_cost += cost

        # Async write step and updated run
        await blackbox_client.save_step_async(step)
        await blackbox_client.save_run_async(self.run)

        return step

    async def finalize(self, status: str = "complete", pass_score: Optional[float] = None):
        self.run.status = status
        self.run.total_latency_ms = (time.time() - self._start_time) * 1000.0
        if pass_score is not None:
            self.run.pass_score = pass_score
            self.run.eval_status = "pass" if pass_score >= 0.7 else "fail"
        await blackbox_client.save_run_async(self.run)
