"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Terminal, Clock, Cpu, Layers } from "lucide-react";

export interface TraceStepData {
  step_id: string;
  agent_name: string;
  step_name: string;
  step_type: string; // prompt | retrieval | tool_call | response
  latency_ms: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  estimated_cost?: number;
  status: string; // success | warn | error
  input_payload?: any;
  output_payload?: any;
  retrieved_context?: any[];
  tool_calls?: any[];
  error_message?: string;
}

export interface RunTraceData {
  run_id: string;
  job_id: string;
  company_name: string;
  timestamp: string;
  status: string;
  total_steps: number;
  total_latency_ms: number;
  total_tokens: number;
  total_cost: number;
  eval_status?: string; // pass | fail | unevaluated
  steps: TraceStepData[];
}

interface TraceTapeProps {
  run: RunTraceData;
  density?: "sparkline" | "compact" | "full";
  onSelectRun?: (runId: string) => void;
}

export const TraceTape: React.FC<TraceTapeProps> = ({
  run,
  density = "full",
  onSelectRun,
}) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const getMarkerColor = (step: TraceStepData) => {
    if (step.status === "error") return "var(--color-redaction)";
    if (step.status === "warn") return "var(--color-telemetry)";
    return "var(--color-verdigris)";
  };

  if (density === "sparkline") {
    return (
      <div 
        onClick={() => onSelectRun && onSelectRun(run.run_id)}
        className="flex items-center gap-3 p-2.5 rounded border border-[var(--color-kraft-subtle)] bg-[var(--color-ink)] hover:border-[var(--color-kraft)] cursor-pointer transition-all"
      >
        <span className={run.eval_status === "fail" ? "stamp-fail" : "stamp-pass"}>
          {run.eval_status === "fail" ? "FAIL" : "PASS"}
        </span>

        <span className="font-mono text-xs text-[var(--color-bone)] font-semibold w-24 truncate">
          {run.company_name}
        </span>

        {/* Tape Sparkline Rail */}
        <div className="flex-1 flex items-center gap-1.5 px-2">
          {run.steps.map((step, idx) => (
            <React.Fragment key={step.step_id || idx}>
              <div 
                className="w-2.5 h-2.5 rounded-full transition-transform hover:scale-125"
                style={{ backgroundColor: getMarkerColor(step) }}
                title={`${step.agent_name}: ${step.step_name} (${step.latency_ms}ms)`}
              />
              {idx < run.steps.length - 1 && (
                <div className="flex-1 h-[2px] bg-[var(--color-kraft-subtle)]" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="font-mono text-[11px] text-[var(--color-bone-muted)] w-16 text-right">
          {(run.total_latency_ms / 1000).toFixed(1)}s
        </div>
      </div>
    );
  }

  return (
    <div className="binder-card p-5 mb-4 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)]">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--color-kraft-subtle)]">
        <div className="flex items-center gap-3">
          <span className={run.eval_status === "fail" ? "stamp-fail" : "stamp-pass"}>
            {run.eval_status === "fail" ? "FAIL" : "PASS"}
          </span>
          <h3 className="font-display font-bold text-lg text-[var(--color-bone)]">
            {run.company_name}
          </h3>
          <span className="font-mono text-xs text-[var(--color-bone-muted)]">
            ID: {run.run_id}
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs text-[var(--color-bone-muted)]">
          <span className="flex items-center gap-1">
            <Clock size={13} className="text-[var(--color-telemetry)]" />
            {(run.total_latency_ms / 1000).toFixed(2)}s
          </span>
          <span className="flex items-center gap-1">
            <Layers size={13} className="text-[var(--color-kraft)]" />
            {run.total_tokens} tokens
          </span>
          <span className="text-[var(--color-telemetry)] font-semibold">
            ${run.total_cost.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Flight Recorder Tape Rail */}
      <div className="my-6 relative px-2">
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[var(--color-kraft-subtle)] -translate-y-1/2 z-0" />
        <div className="relative z-10 flex items-center justify-between">
          {run.steps.map((step, index) => {
            const isExpanded = expandedStepId === step.step_id;
            const markerBg = getMarkerColor(step);

            return (
              <div 
                key={step.step_id || index}
                className="flex flex-col items-center group cursor-pointer"
                onClick={() => setExpandedStepId(isExpanded ? null : step.step_id)}
              >
                <div className="text-[10px] font-mono text-[var(--color-bone-muted)] mb-1 group-hover:text-[var(--color-telemetry)]">
                  {step.latency_ms}ms
                </div>

                <motion.div 
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-[var(--color-ink)]"
                  style={{ backgroundColor: markerBg }}
                >
                  <span className="text-[9px] font-mono font-bold text-[var(--color-ink)]">
                    {index + 1}
                  </span>
                </motion.div>

                <div className="text-[11px] font-mono font-medium text-[var(--color-bone)] mt-1 max-w-[90px] truncate text-center">
                  {step.step_name}
                </div>
                <div className="text-[9px] font-mono text-[var(--color-bone-muted)]">
                  {step.agent_name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Step Detail Tape Inspector */}
      <AnimatePresence>
        {expandedStepId && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {run.steps
              .filter((s) => s.step_id === expandedStepId)
              .map((step) => (
                <div key={step.step_id} className="p-4 rounded border border-[var(--color-kraft-subtle)] bg-[var(--color-ink)] text-xs space-y-3 font-mono">
                  <div className="flex items-center justify-between text-[var(--color-telemetry)] font-bold">
                    <span className="flex items-center gap-2">
                      <Terminal size={14} /> STEP {step.step_name} ({step.agent_name})
                    </span>
                    <span>TYPE: {step.step_type.toUpperCase()}</span>
                  </div>

                  {step.input_payload && (
                    <div>
                      <div className="text-[var(--color-bone-muted)] text-[10px] uppercase mb-1">INPUT PAYLOAD</div>
                      <pre className="p-2 bg-[#120f0d] rounded text-[var(--color-bone)] text-[11px] overflow-x-auto border border-rgba(251,191,36,0.1)">
                        {JSON.stringify(step.input_payload, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.retrieved_context && step.retrieved_context.length > 0 && (
                    <div>
                      <div className="text-[var(--color-verdigris)] text-[10px] uppercase mb-1">RETRIEVED CONTEXT</div>
                      <pre className="p-2 bg-[#120f0d] rounded text-[var(--color-bone)] text-[11px] overflow-x-auto border border-rgba(76,122,102,0.2)">
                        {JSON.stringify(step.retrieved_context, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.tool_calls && step.tool_calls.length > 0 && (
                    <div>
                      <div className="text-[var(--color-kraft)] text-[10px] uppercase mb-1">EXECUTED TOOL CALLS</div>
                      <pre className="p-2 bg-[#120f0d] rounded text-[var(--color-bone)] text-[11px] overflow-x-auto border border-rgba(201,178,124,0.2)">
                        {JSON.stringify(step.tool_calls, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.output_payload && (
                    <div>
                      <div className="text-[var(--color-bone-muted)] text-[10px] uppercase mb-1">STEP OUTPUT</div>
                      <pre className="p-2 bg-[#120f0d] rounded text-[var(--color-bone)] text-[11px] overflow-x-auto">
                        {typeof step.output_payload === 'string' ? step.output_payload : JSON.stringify(step.output_payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
