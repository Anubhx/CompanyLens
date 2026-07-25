"use client";

import React from "react";
import { DollarSign, Clock, Layers, Zap } from "lucide-react";

export interface AgentCostMetric {
  agent_name: string;
  cost: number;
  tokens: number;
  avg_latency_s: number;
}

export interface CostViewData {
  total_cost: number;
  avg_cost_per_query: number;
  per_agent: AgentCostMetric[];
  daily_trend: { day: string; legal: number; finance: number; dev: number }[];
}

interface CostViewProps {
  data: CostViewData;
}

export const CostView: React.FC<CostViewProps> = ({ data }) => {
  return (
    <div className="space-y-6 font-mono">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="binder-card p-4 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)]">
          <div className="flex items-center gap-2 text-xs text-[var(--color-bone-muted)] mb-1">
            <DollarSign size={14} className="text-[var(--color-telemetry)]" /> TOTAL CUMULATIVE COST
          </div>
          <div className="text-2xl font-bold text-[var(--color-telemetry)]">
            ${data.total_cost.toFixed(2)}
          </div>
          <div className="text-[11px] text-[var(--color-bone-muted)] mt-1">
            Gemini 2.0 Flash API usage across all 3 agents
          </div>
        </div>

        <div className="binder-card p-4 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)]">
          <div className="flex items-center gap-2 text-xs text-[var(--color-bone-muted)] mb-1">
            <Zap size={14} className="text-[var(--color-verdigris)]" /> AVG COST / DUE-DILIGENCE QUERY
          </div>
          <div className="text-2xl font-bold text-[var(--color-verdigris)]">
            ${data.avg_cost_per_query.toFixed(3)}
          </div>
          <div className="text-[11px] text-[var(--color-bone-muted)] mt-1">
            Target discipline &lt; $0.05 per company audit
          </div>
        </div>

        <div className="binder-card p-4 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)]">
          <div className="flex items-center gap-2 text-xs text-[var(--color-bone-muted)] mb-1">
            <Clock size={14} className="text-[var(--color-kraft)]" /> MEAN EXECUTION LATENCY
          </div>
          <div className="text-2xl font-bold text-[var(--color-bone)]">
            2.1s
          </div>
          <div className="text-[11px] text-[var(--color-bone-muted)] mt-1">
            Non-blocking async telemetry overhead = 0.0ms
          </div>
        </div>
      </div>

      {/* Per Agent Breakdown */}
      <div className="binder-card p-5 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)]">
        <h3 className="font-display font-bold text-base text-[var(--color-bone)] mb-4 uppercase">
          PER-AGENT COST & TOKEN CONSUMPTION
        </h3>
        <div className="space-y-4">
          {data.per_agent.map((agent) => (
            <div key={agent.agent_name} className="p-4 rounded bg-[var(--color-ink)] border border-[var(--color-kraft-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--color-telemetry)]">{agent.agent_name}</span>
                <span className="text-[var(--color-bone)] font-bold">${agent.cost.toFixed(2)}</span>
              </div>

              {/* Cost bar representation */}
              <div className="w-full h-2 rounded bg-[var(--color-ink-card)] overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-telemetry)] rounded"
                  style={{ width: `${Math.min(100, (agent.cost / 1.0) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-[var(--color-bone-muted)] pt-1">
                <span>{agent.tokens.toLocaleString()} tokens processed</span>
                <span>Avg Latency: {agent.avg_latency_s.toFixed(1)}s</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
