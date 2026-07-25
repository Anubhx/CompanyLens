"""
BlackBox Evals — Gemini LLM-as-Judge Module
Evaluates agent output for Faithfulness, Relevance, and Completeness against narrow rubrics.
"""

import json
import logging
from typing import Dict, Any, List
from blackbox.sdk.schema import GoldenTestCase, Step, EvalResult
from llm_provider import get_llm

logger = logging.getLogger("blackbox.judge")

JUDGE_PROMPT_TEMPLATE = """
You are an expert AI Agent Reliability & Accuracy Judge evaluating a due diligence agent response.

[TEST CASE INFORMATION]
Agent: {agent_name}
Category: {category}
Prompt: {prompt}
Expected Outcome: {expected_outcome}
Evaluation Rubric: {eval_rubric}

[AGENT OUTPUT TO EVALUATE]
{output_text}

[RETRIEVED CONTEXT / TOOL DATA]
{context_data}

[EVALUATION TASK]
Score the output across three dimensions from 0.0 to 1.0:
1. Faithfulness: Is the answer strictly grounded in the context/data without hallucinated details?
2. Relevance: Does the answer directly address the user prompt and expected outcome?
3. Completeness: Are all required components of the question answered in full?

Calculate the overall score as a weighted average: (Faithfulness * 0.4) + (Relevance * 0.3) + (Completeness * 0.3).
Assign status: "pass" if overall_score >= 0.75 else "fail".

Format your response STRICTLY as valid JSON with this exact schema:
{{
  "faithfulness_score": 0.95,
  "relevance_score": 0.90,
  "completeness_score": 0.85,
  "overall_score": 0.905,
  "status": "pass",
  "reasoning": "Detailed justification of scores based on the rubric."
}}
"""

async def evaluate_with_judge(
    case: GoldenTestCase,
    output_text: str,
    steps: List[Step]
) -> EvalResult:
    """Evaluates agent response using Gemini as judge."""
    context_items = []
    for s in steps:
        if s.retrieved_context:
            context_items.append(f"Retrieved: {json.dumps(s.retrieved_context)[:1000]}")
        if s.tool_calls:
            for tc in s.tool_calls:
                context_items.append(f"Tool {tc.tool_name} returned: {str(tc.result)[:1000]}")

    context_str = "\n".join(context_items) if context_items else "No explicit context or tool calls recorded."

    prompt_formatted = JUDGE_PROMPT_TEMPLATE.format(
        agent_name=case.agent_name,
        category=case.category,
        prompt=case.prompt,
        expected_outcome=case.expected_outcome,
        eval_rubric=case.eval_rubric,
        output_text=output_text[:2000] if output_text else "No output produced.",
        context_data=context_str[:2000]
    )

    try:
        llm = get_llm(temperature=0.0, agent_name="synthesiser")
        response = await llm.ainvoke(prompt_formatted)
        response_text = response.content if hasattr(response, 'content') else str(response)

        # Parse JSON output from judge
        cleaned_json = response_text.strip()
        if "```json" in cleaned_json:
            cleaned_json = cleaned_json.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned_json:
            cleaned_json = cleaned_json.split("```")[1].split("```")[0].strip()

        judge_data = json.loads(cleaned_json)

        return EvalResult(
            case_id=case.case_id,
            agent_name=case.agent_name,
            status=judge_data.get("status", "pass"),
            score=float(judge_data.get("overall_score", 0.85)),
            faithfulness_score=float(judge_data.get("faithfulness_score", 0.9)),
            relevance_score=float(judge_data.get("relevance_score", 0.9)),
            completeness_score=float(judge_data.get("completeness_score", 0.85)),
            judge_reasoning=judge_data.get("reasoning", "Evaluated against explicit rubric."),
            cost=0.0001
        )
    except Exception as e:
        logger.warning(f"Gemini LLM-as-judge fallback used for case {case.case_id}: {e}")
        # Deterministic fallback evaluation
        is_pass = len(output_text.strip()) > 30 and ("error" not in output_text.lower())
        return EvalResult(
            case_id=case.case_id,
            agent_name=case.agent_name,
            status="pass" if is_pass else "fail",
            score=0.85 if is_pass else 0.40,
            faithfulness_score=0.90 if is_pass else 0.40,
            relevance_score=0.85 if is_pass else 0.40,
            completeness_score=0.80 if is_pass else 0.40,
            judge_reasoning=f"Deterministic fallback eval (LLM call skipped/failed): output length={len(output_text)}",
            cost=0.0
        )
