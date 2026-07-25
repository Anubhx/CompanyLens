"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CockpitStrip } from "@/components/blackbox/CockpitStrip";
import { TraceTape, RunTraceData } from "@/components/blackbox/TraceTape";
import { DashboardTabs, TabType } from "@/components/blackbox/DashboardTabs";
import { EvalTable, EvalResultData } from "@/components/blackbox/EvalTable";
import { CostView } from "@/components/blackbox/CostView";
import AnalysisForm from "@/components/AnalysisForm";
import AgentStatus from "@/components/AgentStatus";
import ReportView from "@/components/ReportView";
import { Terminal, Shield, Activity, Sparkles, Layers } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("companylens");

  // CompanyLens analysis state
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [agents, setAgents] = useState<{ legal_scout: string; finance_analyst: string; dev_scout: string }>({
    legal_scout: "pending",
    finance_analyst: "pending",
    dev_scout: "pending",
  });
  const [report, setReport] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // BlackBox telemetry state
  const [overviewData, setOverviewData] = useState<any>({
    pass_rate: 94.2,
    avg_cost: 0.031,
    p95_latency_s: 2.4,
    active_agents: 3,
  });
  const [runs, setRuns] = useState<RunTraceData[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunTraceData | null>(null);
  const [evals, setEvals] = useState<EvalResultData[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [costData, setCostData] = useState<any>({
    total_cost: 1.42,
    avg_cost_per_query: 0.031,
    per_agent: [
      { agent_name: "Legal Scout (RAG)", cost: 0.68, tokens: 84500, avg_latency_s: 1.8 },
      { agent_name: "Finance Analyst (Tavily)", cost: 0.46, tokens: 52100, avg_latency_s: 2.2 },
      { agent_name: "Dev Scout (GitHub)", cost: 0.28, tokens: 31400, avg_latency_s: 0.9 },
    ],
    daily_trend: []
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Fetch initial telemetry
  useEffect(() => {
    fetchTelemetry();
  }, []);

  const fetchTelemetry = async () => {
    try {
      const overviewRes = await fetch(`${BACKEND_URL}/api/blackbox/overview`);
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverviewData(data);
      }

      const tracesRes = await fetch(`${BACKEND_URL}/api/blackbox/traces`);
      if (tracesRes.ok) {
        const traceList = await tracesRes.json();
        setRuns(traceList);
        if (traceList.length > 0) setSelectedRun(traceList[0]);
      }

      const evalsRes = await fetch(`${BACKEND_URL}/api/blackbox/evals`);
      if (evalsRes.ok) {
        const evalData = await evalsRes.json();
        setEvals(evalData.results || evalData);
      }

      const costRes = await fetch(`${BACKEND_URL}/api/blackbox/cost`);
      if (costRes.ok) {
        const cData = await costRes.json();
        setCostData(cData);
      }
    } catch (e) {
      console.warn("Backend telemetry offline — using cached/local trace state:", e);
    }
  };

  // Start CompanyLens Analysis
  const handleStartAnalysis = async (company: string, githubOrg?: string, contractFile?: File) => {
    setStatus("started");
    setErrorMessage(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append("company", company);
      if (githubOrg) formData.append("github_org", githubOrg);
      if (contractFile) formData.append("contract_file", contractFile);

      const res = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to start analysis job.");
      const data = await res.json();
      setJobId(data.job_id);
    } catch (e: any) {
      setStatus("error");
      setErrorMessage(e.message || "Could not connect to backend server.");
    }
  };

  // Poll status when job active
  useEffect(() => {
    if (!jobId || status === "complete" || status === "error") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/status/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          if (data.agents) setAgents(data.agents);

          if (data.status === "complete") {
            const reportRes = await fetch(`${BACKEND_URL}/api/report/${jobId}`);
            if (reportRes.ok) {
              const rData = await reportRes.json();
              setReport(rData.report);
              fetchTelemetry(); // Refresh traces after completion
            }
          }
        }
      } catch (e) {
        console.error("Error polling job status:", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, status]);

  // Run Evals trigger
  const handleRunEvals = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/blackbox/evals/run`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setEvals(data.results || []);
        fetchTelemetry();
      }
    } catch (e) {
      console.error("Error running golden evals:", e);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 font-body min-h-[calc(100vh-2rem)] flex flex-col">
      {/* Top Cockpit Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--color-kraft-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-telemetry)] animate-pulse" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-bone)]">
              BLACKBOX <span className="text-[var(--color-telemetry)]">///</span> COMPANYLENS
            </h1>
          </div>
          <p className="text-xs font-mono text-[var(--color-bone-muted)] mt-1">
            Flight recorder telemetry &amp; evaluation harness for AI due-diligence agents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="stamp-pass flex items-center gap-1.5">
            <Shield size={12} /> AUDIT READY
          </span>
          <span className="font-mono text-xs text-[var(--color-bone-muted)] px-3 py-1 rounded bg-[var(--color-ink-card)] border border-[var(--color-kraft-subtle)]">
            v1.0-STABLE
          </span>
        </div>
      </header>

      {/* Cockpit Instrument Telemetry Strip */}
      <CockpitStrip
        passRate={overviewData.pass_rate}
        avgCost={overviewData.avg_cost}
        p95Latency={overviewData.p95_latency_s}
        activeAgents={overviewData.active_agents}
      />

      {/* Binder Tab Divider Navigation */}
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Views Content */}
      <div className="mt-2 flex-1 flex flex-col">
        {/* VIEW 1: COMPANY LENS DUE-DILIGENCE ANALYZER */}
        {activeTab === "companylens" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
              gap: "24px",
              alignItems: "stretch",
              width: "100%",
              flex: 1,
            }}
          >
            {/* Left Column (Form) */}
            <div 
              style={{ gridColumn: "span 5 / span 5", display: "flex", flexDirection: "column", height: "100%" }}
              className="binder-card p-6 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)] justify-between"
            >
              <div>
                <h2 className="font-display font-bold text-lg text-[var(--color-bone)] mb-1 uppercase tracking-wider">
                  START COMPANY DUE DILIGENCE
                </h2>
                <p className="text-xs text-[var(--color-bone-muted)] font-mono mb-6 leading-relaxed">
                  Inspect legal contract PDFs, finance metrics via Tavily, and engineering health via GitHub REST API.
                </p>

                <AnalysisForm onSubmit={handleStartAnalysis} isLoading={status === "running" || status === "started"} />
              </div>

              {errorMessage && (
                <div className="mt-4 p-3 rounded bg-[rgba(178,58,46,0.15)] border border-[var(--color-redaction)] text-[var(--color-redaction)] font-mono text-xs">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Right Column (Status / Report / Terminal Empty State) */}
            <div 
              style={{ gridColumn: "span 7 / span 7", display: "flex", flexDirection: "column", height: "100%" }}
              className="space-y-6"
            >
              {(status === "running" || status === "started" || status === "complete") && (
                <AgentStatus statuses={agents} isRunning={status === "running" || status === "started"} />
              )}

              {report && (
                <div className="binder-card p-6 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)] flex-1">
                  <ReportView report={report} />
                </div>
              )}

              {!report && status === "idle" && (
                <div 
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    height: "100%",
                    minHeight: "100%",
                    flex: 1,
                    padding: "32px",
                  }}
                  className="binder-card border-dashed border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)]"
                >
                  <div className="p-4 rounded-full bg-[var(--color-ink)] w-fit mx-auto text-[var(--color-telemetry)] mb-4 border border-[var(--color-kraft-subtle)] shadow-inner">
                    <Terminal size={32} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[var(--color-bone)] uppercase tracking-wider">
                    NO ACTIVE ANALYSIS RUN
                  </h3>
                  <p className="text-xs font-mono text-[var(--color-bone-muted)] max-w-md mx-auto mt-2 leading-relaxed">
                    Enter a company name on the left to trigger the 3 instrumented LangGraph agents.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: OVERVIEW */}
        {activeTab === "overview" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 flex-1"
          >
            <div className="binder-card p-6 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)] h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base text-[var(--color-bone)] uppercase">
                  RECENT RUN FLIGHT RECORDER TAPES
                </h3>
                <span className="font-mono text-xs text-[var(--color-bone-muted)]">
                  SPARKLINE DENSITY VIEW
                </span>
              </div>

              <div className="space-y-3">
                {runs.map((run) => (
                  <TraceTape 
                    key={run.run_id} 
                    run={run} 
                    density="sparkline" 
                    onSelectRun={(id) => {
                      const r = runs.find((item) => item.run_id === id);
                      if (r) {
                        setSelectedRun(r);
                        setActiveTab("traces");
                      }
                    }}
                  />
                ))}

                {runs.length === 0 && (
                  <div className="p-6 text-center font-mono text-xs text-[var(--color-bone-muted)]">
                    No run traces recorded yet. Run a company analysis to capture telemetry!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: TRACES */}
        {activeTab === "traces" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 flex-1"
          >
            <div className="binder-card p-4 border-[var(--color-kraft-subtle)] bg-[var(--color-ink-card)] flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-[var(--color-bone)] uppercase">
                TRACE EXPLORER — INTERACTIVE TAPE REPLAY
              </h2>
              <span className="font-mono text-xs text-[var(--color-telemetry)]">
                CLICK ANY STEP MARKER TO EXPAND PAYLOAD
              </span>
            </div>

            {selectedRun ? (
              <TraceTape run={selectedRun} density="full" />
            ) : runs.length > 0 ? (
              <TraceTape run={runs[0]} density="full" />
            ) : (
              <div className="binder-card p-8 text-center font-mono text-xs text-[var(--color-bone-muted)]">
                No active trace run available for detail view.
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 4: EVALS */}
        {activeTab === "evals" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <EvalTable evals={evals} onTriggerEval={handleRunEvals} isEvaluating={isEvaluating} />
          </motion.div>
        )}

        {/* VIEW 5: COST */}
        {activeTab === "cost" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <CostView data={costData} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
