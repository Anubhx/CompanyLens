"""
BlackBox Evals — Deterministic Checker
Rule-based evaluation of tool usage, retrieved context hits, and response keywords.
"""

from typing import Dict, Any, List, Tuple
from blackbox.sdk.schema import Step, ToolCall, GoldenTestCase

def evaluate_deterministic(case: GoldenTestCase, output_text: str, steps: List[Step]) -> Tuple[float, List[str]]:
    """
    Evaluates deterministic checks:
    1. Tool call presence (did dev_scout call github, finance call tavily)
    2. Expected keyword hits
    3. Error-free execution check
    """
    score = 1.0
    reasons = []

    # Check 1: Executed tool calls match expectations
    if case.expected_tools:
        executed_tool_names = set()
        for s in steps:
            for tc in s.tool_calls:
                executed_tool_names.add(tc.tool_name.lower())
        
        for expected_tool in case.expected_tools:
            if not any(expected_tool.lower() in t for t in executed_tool_names):
                score -= 0.3
                reasons.append(f"Missing expected tool call: '{expected_tool}'")

    # Check 2: Keyword presence in output
    if case.expected_keywords:
        lower_output = output_text.lower()
        matched_keywords = [kw for kw in case.expected_keywords if kw.lower() in lower_output]
        match_ratio = len(matched_keywords) / len(case.expected_keywords)
        if match_ratio < 0.5:
            score -= 0.3
            reasons.append(f"Only matched {len(matched_keywords)}/{len(case.expected_keywords)} keywords")

    # Check 3: Check for explicit step errors
    error_steps = [s for s in steps if s.status == "error"]
    if error_steps:
        score -= 0.4
        reasons.append(f"Encountered {len(error_steps)} error steps during execution")

    final_score = max(0.0, round(score, 2))
    return final_score, reasons
