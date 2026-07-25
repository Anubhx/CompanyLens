"use client";

import React from "react";

interface AgentStatusProps {
  statuses: { legal_scout: string; finance_analyst: string; dev_scout: string };
  isRunning?: boolean;
}

const agentConfig = [
  {
    key: "legal_scout" as const,
    name: "Legal Scout",
    icon: "📋",
    description: "Contract risk & clause audit",
    color: "var(--color-telemetry)",
  },
  {
    key: "finance_analyst" as const,
    name: "Finance Analyst",
    icon: "📊",
    description: "Financial health & Tavily search",
    color: "var(--color-kraft)",
  },
  {
    key: "dev_scout" as const,
    name: "Dev Scout",
    icon: "💻",
    description: "GitHub engineering reputation",
    color: "var(--color-verdigris)",
  },
];

function getStatusInfo(status: string) {
  switch (status) {
    case "running":
      return { label: "Running...", dotColor: "var(--color-telemetry)", pulse: true };
    case "complete":
      return { label: "Complete ✓", dotColor: "var(--color-verdigris)", pulse: false };
    case "skipped":
      return { label: "Skipped", dotColor: "var(--color-bone-muted)", pulse: false };
    case "error":
      return { label: "Error ✗", dotColor: "var(--color-redaction)", pulse: false };
    default:
      return { label: "Pending", dotColor: "var(--color-bone-muted)", pulse: false };
  }
}

export default function AgentStatus({ statuses, isRunning }: AgentStatusProps) {
  return (
    <div className="binder-card p-6 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm text-[var(--color-bone)] uppercase tracking-wider">
          AGENT PIPELINE ORCHESTRATION
        </h3>
        <span className="font-mono text-xs text-[var(--color-telemetry)]">
          {isRunning ? "PROCESSING PIPELINE..." : "PIPELINE COMPLETED"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agentConfig.map((agent) => {
          const status = statuses[agent.key] || "pending";
          const info = getStatusInfo(status);

          return (
            <div
              key={agent.key}
              className="p-4 rounded bg-[var(--color-ink)] border border-[var(--color-kraft-subtle)] flex flex-col items-center text-center space-y-2"
            >
              <span className="text-2xl">{agent.icon}</span>
              <span className="font-display font-bold text-sm text-[var(--color-bone)]">
                {agent.name}
              </span>
              <span className="font-mono text-[11px] text-[var(--color-bone-muted)]">
                {agent.description}
              </span>

              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold"
                style={{
                  backgroundColor: "rgba(201, 178, 124, 0.1)",
                  color: info.dotColor,
                }}
              >
                <span
                  className={info.pulse ? "w-2 h-2 rounded-full animate-ping" : "w-2 h-2 rounded-full"}
                  style={{ backgroundColor: info.dotColor }}
                />
                {info.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
