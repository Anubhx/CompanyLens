"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getStatus, getReport } from "@/lib/api";
import type { AgentStatuses, FinalReport } from "@/lib/api";
import AgentStatus from "@/components/AgentStatus";
import ReportView from "@/components/ReportView";

export default function ReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = params.id as string;
  const company = searchParams.get("company") || "Company";

  const [status, setStatus] = useState<string>("started");
  const [agents, setAgents] = useState<AgentStatuses>({
    legal_scout: "pending",
    finance_analyst: "pending",
    dev_scout: "pending",
  });
  const [report, setReport] = useState<FinalReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollStatus = useCallback(async () => {
    try {
      const statusRes = await getStatus(jobId);
      setStatus(statusRes.status);
      setAgents(statusRes.agents);

      if (statusRes.status === "complete") {
        const reportRes = await getReport(jobId);
        if (reportRes.report) {
          setReport(reportRes.report);
        }
        return true; // stop polling
      }

      if (statusRes.status === "error") {
        setError("Analysis encountered an error. Please try again.");
        return true; // stop polling
      }

      return false; // keep polling
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status");
      return true; // stop polling
    }
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      const done = await pollStatus();
      if (!done && !cancelled) {
        setTimeout(poll, 2000);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [pollStatus]);

  return (
    <div style={{
      maxWidth: "960px",
      margin: "0 auto",
      padding: "100px 24px 60px",
    }}>
      {/* Agent Status Cards — always show */}
      <div style={{ marginBottom: "40px" }}>
        <AgentStatus agents={agents} company={company} />
      </div>

      {/* Loading state */}
      {status === "running" || status === "started" ? (
        <div className="glass-card" style={{
          padding: "40px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "3px solid var(--border-subtle)",
            borderTopColor: "var(--accent-indigo)",
            animation: "spin 1s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>
            Agents are analysing <strong style={{ color: "var(--text-primary)" }}>{company}</strong>...
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            This typically takes 30-60 seconds
          </p>
        </div>
      ) : null}

      {/* Error state */}
      {error && (
        <div className="glass-card" style={{
          padding: "32px",
          textAlign: "center",
          border: "1px solid rgba(244, 63, 94, 0.2)",
        }}>
          <p style={{ color: "var(--accent-rose)", fontSize: "15px", marginBottom: "16px" }}>
            ⚠ {error}
          </p>
          <a href="/" style={{
            color: "var(--accent-indigo)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
          }}>
            ← Try another company
          </a>
        </div>
      )}

      {/* Report */}
      {report && (
        <ReportView report={report} company={company} />
      )}

      {/* Back link */}
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <a href="/" style={{
          color: "var(--text-muted)",
          textDecoration: "none",
          fontSize: "14px",
          transition: "color 0.2s",
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = "var(--accent-indigo)"; }}
        onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          ← Analyse another company
        </a>
      </div>
    </div>
  );
}
