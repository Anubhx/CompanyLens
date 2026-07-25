"use client";

import React from "react";
import { Activity, DollarSign, Clock, ShieldCheck, Cpu } from "lucide-react";

interface CockpitStripProps {
  passRate: number;
  avgCost: number;
  p95Latency: number;
  activeAgents: number;
}

export const CockpitStrip: React.FC<CockpitStripProps> = ({
  passRate,
  avgCost,
  p95Latency,
  activeAgents,
}) => {
  return (
    <div className="binder-card p-4 mb-6 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Pass Rate */}
        <div className="flex items-center gap-3 p-3 rounded bg-[var(--color-ink)] border border-[var(--color-kraft-subtle)]">
          <div className="p-2 rounded bg-[rgba(76,122,102,0.15)] text-[var(--color-verdigris)]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-[11px] font-mono text-[var(--color-bone-muted)] uppercase tracking-wider">
              SYSTEM PASS RATE
            </div>
            <div className="text-xl font-mono font-bold text-[var(--color-verdigris)]">
              {passRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Metric 2: Avg Cost */}
        <div className="flex items-center gap-3 p-3 rounded bg-[var(--color-ink)] border border-[var(--color-kraft-subtle)]">
          <div className="p-2 rounded bg-[rgba(232,163,61,0.15)] text-[var(--color-telemetry)]">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-[11px] font-mono text-[var(--color-bone-muted)] uppercase tracking-wider">
              AVG COST / QUERY
            </div>
            <div className="text-xl font-mono font-bold text-[var(--color-telemetry)]">
              ${avgCost.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Metric 3: P95 Latency */}
        <div className="flex items-center gap-3 p-3 rounded bg-[var(--color-ink)] border border-[var(--color-kraft-subtle)]">
          <div className="p-2 rounded bg-[rgba(201,178,124,0.15)] text-[var(--color-kraft)]">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[11px] font-mono text-[var(--color-bone-muted)] uppercase tracking-wider">
              P95 LATENCY
            </div>
            <div className="text-xl font-mono font-bold text-[var(--color-bone)]">
              {p95Latency.toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Metric 4: Active Agents */}
        <div className="flex items-center gap-3 p-3 rounded bg-[var(--color-ink)] border border-[var(--color-kraft-subtle)]">
          <div className="p-2 rounded bg-[rgba(232,163,61,0.15)] text-[var(--color-telemetry)]">
            <Cpu size={20} />
          </div>
          <div>
            <div className="text-[11px] font-mono text-[var(--color-bone-muted)] uppercase tracking-wider">
              INSTRUMENTED AGENTS
            </div>
            <div className="text-xl font-mono font-bold text-[var(--color-telemetry)]">
              {activeAgents} ACTIVE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
