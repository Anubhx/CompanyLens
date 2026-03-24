"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AnalysisForm from "@/components/AnalysisForm";
import { startAnalysis } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (company: string, githubOrg?: string, contractFile?: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await startAnalysis(company, githubOrg, contractFile);
      router.push(`/report/${result.job_id}?company=${encodeURIComponent(company)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis. Is the backend running?");
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "calc(100vh - 72px)",
      padding: "40px 24px",
    }}>
      {/* Hero Section */}
      <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: "48px", maxWidth: "600px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 16px",
          borderRadius: "20px",
          background: "rgba(99, 102, 241, 0.1)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          marginBottom: "24px",
          fontSize: "12px",
          fontWeight: 500,
          color: "var(--accent-indigo)",
        }}>
          <span className="pulse-dot" style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "var(--accent-indigo)",
          }} />
          Powered by 3 AI Agents
        </div>

        <h1 style={{
          fontSize: "48px",
          fontWeight: 900,
          letterSpacing: "-1.5px",
          lineHeight: "1.1",
          marginBottom: "16px",
        }}>
          <span>Company Due Diligence</span><br />
          <span style={{
            background: "var(--gradient-primary)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>in 60 Seconds</span>
        </h1>

        <p style={{
          fontSize: "16px",
          color: "var(--text-secondary)",
          lineHeight: "1.7",
          maxWidth: "480px",
          margin: "0 auto",
        }}>
          Legal risk · Financial health · Engineering reputation<br />
          Three AI agents analyze everything in parallel, giving you a structured due-diligence report instantly.
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card animate-fade-in-delay" style={{
        width: "100%",
        maxWidth: "520px",
        padding: "36px",
      }}>
        <AnalysisForm onSubmit={handleSubmit} isLoading={isLoading} />

        {error && (
          <div style={{
            marginTop: "16px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.2)",
            color: "var(--accent-rose)",
            fontSize: "13px",
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Feature badges */}
      <div className="animate-fade-in-delay-2" style={{
        display: "flex",
        gap: "12px",
        marginTop: "32px",
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        {["LangGraph Orchestration", "Gemini AI", "Real-time Analysis"].map((badge) => (
          <span key={badge} style={{
            padding: "6px 14px",
            borderRadius: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}>
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
