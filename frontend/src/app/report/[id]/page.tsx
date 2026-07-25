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
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Agent Status Cards */}
      <div className="mb-8">
        <AgentStatus statuses={agents} isRunning={status === "running" || status === "started"} />
      </div>

      {/* Loading state */}
      {status === "running" || status === "started" ? (
        <div className="binder-card p-8 text-center flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-kraft-subtle)] border-t-[var(--color-telemetry)] animate-spin" />
          <p className="font-mono text-sm text-[var(--color-bone-muted)]">
            Agents analyzing <strong className="text-[var(--color-bone)]">{company}</strong>...
          </p>
        </div>
      ) : null}

      {/* Error state */}
      {error && (
        <div className="binder-card p-6 text-center border-[var(--color-redaction)] bg-[rgba(178,58,46,0.1)]">
          <p className="font-mono text-sm text-[var(--color-redaction)] mb-4">
            ⚠ {error}
          </p>
          <a href="/" className="font-mono text-xs text-[var(--color-telemetry)] hover:underline">
            ← Return to Dashboard
          </a>
        </div>
      )}

      {/* Report */}
      {report && (
        <ReportView report={report} company={company} />
      )}

      {/* Back link */}
      <div className="text-center mt-8">
        <a href="/" className="font-mono text-xs text-[var(--color-bone-muted)] hover:text-[var(--color-telemetry)]">
          ← Analyse another company
        </a>
      </div>
    </div>
  );
}
