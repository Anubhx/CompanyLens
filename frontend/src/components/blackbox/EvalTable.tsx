"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle2, XCircle, ChevronDown, ChevronRight, Scale, Award } from "lucide-react";

export interface EvalResultData {
  eval_id: string;
  case_id: string;
  agent_name: string;
  status: string; // pass | fail
  score: number;
  faithfulness_score: number;
  relevance_score: number;
  completeness_score: number;
  judge_reasoning: string;
  latency_ms: number;
  cost: number;
  timestamp?: string;
}

interface EvalTableProps {
  evals: EvalResultData[];
  onTriggerEval: () => void;
  isEvaluating: boolean;
}

export const EvalTable: React.FC<EvalTableProps> = ({
  evals,
  onTriggerEval,
  isEvaluating,
}) => {
  const [expandedEvalId, setExpandedEvalId] = useState<string | null>(null);

  const passedCount = evals.filter((e) => e.status === "pass").length;
  const passRate = evals.length > 0 ? ((passedCount / evals.length) * 100).toFixed(1) : "100.0";
  const avgScore = evals.length > 0 ? (evals.reduce((acc, curr) => acc + curr.score, 0) / evals.length).toFixed(2) : "0.91";

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="binder-card p-4 flex flex-wrap items-center justify-between gap-4 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)]">
        <div>
          <h2 className="font-display font-bold text-lg text-[var(--color-bone)]">
            GOLDEN DATASET EVALUATION HARNESS
          </h2>
          <p className="text-xs text-[var(--color-bone-muted)] font-mono mt-0.5">
            30+ due-diligence test cases scored via Gemini LLM-as-Judge & deterministic rules.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="font-mono text-xs text-right">
            <div className="text-[var(--color-bone-muted)]">GOLDEN PASS RATE</div>
            <div className="text-lg font-bold text-[var(--color-verdigris)]">{passRate}%</div>
          </div>

          <button
            onClick={onTriggerEval}
            disabled={isEvaluating}
            className="btn-telemetry flex items-center gap-2"
          >
            <Play size={16} className={isEvaluating ? "animate-spin" : ""} />
            {isEvaluating ? "EVALUATING..." : "RUN EVALS NOW"}
          </button>
        </div>
      </div>

      {/* Eval Results Table */}
      <div className="binder-card overflow-hidden border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)]">
        <table className="w-full text-left font-mono text-xs">
          <thead className="border-b border-[var(--color-kraft-subtle)] bg-[var(--color-ink)] text-[var(--color-bone-muted)] uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4">CASE ID</th>
              <th className="py-3 px-4">AGENT</th>
              <th className="py-3 px-4">SCORE</th>
              <th className="py-3 px-4">FAITHFULNESS</th>
              <th className="py-3 px-4">RELEVANCE</th>
              <th className="py-3 px-4">COMPLETENESS</th>
              <th className="py-3 px-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-kraft-subtle)]">
            {evals.map((item) => {
              const isExpanded = expandedEvalId === item.eval_id;
              const isPass = item.status === "pass";

              return (
                <React.Fragment key={item.eval_id}>
                  <tr 
                    onClick={() => setExpandedEvalId(isExpanded ? null : item.eval_id)}
                    className="hover:bg-[var(--color-ink)] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className={isPass ? "stamp-pass" : "stamp-fail"}>
                        {isPass ? "PASS" : "FAIL"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[var(--color-bone)]">
                      {item.case_id}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-telemetry)]">
                      {item.agent_name}
                    </td>
                    <td className="py-3 px-4 font-bold text-[var(--color-bone)]">
                      {item.score.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-[var(--color-bone-muted)]">
                      {(item.faithfulness_score * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 text-[var(--color-bone-muted)]">
                      {(item.relevance_score * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 text-[var(--color-bone-muted)]">
                      {(item.completeness_score * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-[var(--color-telemetry)] hover:underline flex items-center justify-end gap-1 ml-auto">
                        Reasoning {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Judge Reasoning */}
                  <AnimatePresence>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="bg-[var(--color-ink)] p-4">
                          <div className="border-l-2 border-[var(--color-telemetry)] pl-3 space-y-2">
                            <div className="text-[11px] font-bold text-[var(--color-telemetry)] flex items-center gap-1.5">
                              <Scale size={14} /> GEMINI JUDGE REASONING RUBRIC
                            </div>
                            <p className="text-xs text-[var(--color-bone)] leading-relaxed">
                              {item.judge_reasoning}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
