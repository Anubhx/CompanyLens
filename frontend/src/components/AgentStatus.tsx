"use client";

import React from "react";
import type { AgentStatuses } from "@/lib/api";

interface AgentStatusProps {
  agents: AgentStatuses;
  company: string;
}

const agentConfig = [
  {
    key: "legal_scout" as const,
    name: "Legal Scout",
    icon: "📋",
    description: "Contract risk analysis",
    color: "#f59e0b",
  },
  {
    key: "finance_analyst" as const,
    name: "Finance Analyst",
    icon: "📊",
    description: "Financial health check",
    color: "#6366f1",
  },
  {
    key: "dev_scout" as const,
    name: "Dev Scout",
    icon: "💻",
    description: "Engineering reputation",
    color: "#06b6d4",
  },
];

function getStatusInfo(status: string) {
  switch (status) {
    case "running":
      return { label: "Running...", dotColor: "#6366f1", pulse: true };
    case "complete":
      return { label: "Complete ✓", dotColor: "#10b981", pulse: false };
    case "skipped":
      return { label: "Skipped", dotColor: "#5a5a72", pulse: false };
    case "error":
      return { label: "Error ✗", dotColor: "#f43f5e", pulse: false };
    default:
      return { label: "Pending", dotColor: "#5a5a72", pulse: false };
  }
}

export default function AgentStatus({ agents, company }: AgentStatusProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "8px",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700 }}>
          Analysing: <span style={{ color: "var(--accent-indigo)" }}>{company}</span>
        </h2>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
      }}>
        {agentConfig.map((agent, index) => {
          const status = agents[agent.key];
          const info = getStatusInfo(status);

          return (
            <div
              key={agent.key}
              className="glass-card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                textAlign: "center",
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`,
                opacity: 0,
              }}
            >
              <span style={{ fontSize: "32px" }}>{agent.icon}</span>
              <span style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}>
                {agent.name}
              </span>
              <span style={{
                fontSize: "11px",
                color: "var(--text-muted)",
              }}>
                {agent.description}
              </span>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "4px",
                padding: "6px 14px",
                borderRadius: "20px",
                background: `${info.dotColor}15`,
                border: `1px solid ${info.dotColor}30`,
              }}>
                <span
                  className={info.pulse ? "pulse-dot" : ""}
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: info.dotColor,
                  }}
                />
                <span style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: info.dotColor,
                }}>
                  {info.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
