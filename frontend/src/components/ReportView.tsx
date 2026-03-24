"use client";

import React from "react";
import type { FinalReport } from "@/lib/api";
import ScoreBadge from "./ScoreBadge";

interface ReportViewProps {
  report: FinalReport;
  company: string;
}

function getRecommendationStyle(rec: string) {
  if (rec.includes("GOOD")) return { bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)", color: "#10b981", icon: "✓" };
  if (rec.includes("CAUTION")) return { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", color: "#f59e0b", icon: "⚠" };
  return { bg: "rgba(244, 63, 94, 0.1)", border: "rgba(244, 63, 94, 0.3)", color: "#f43f5e", icon: "✗" };
}

export default function ReportView({ report, company }: ReportViewProps) {
  const recStyle = getRecommendationStyle(report.recommendation);

  const copyReport = () => {
    const text = `CompanyLens Report — ${company}\n\nOverall Score: ${report.overall_score}/10\nRecommendation: ${report.recommendation}\n\n${report.executive_summary}\n\nRed Flags:\n${report.red_flags.map(f => `  ⚠ ${f}`).join("\n")}\n\nGreen Flags:\n${report.green_flags.map(f => `  ✓ ${f}`).join("\n")}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "16px",
      }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>
            {company}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Due Diligence Report · {new Date(report.generated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={copyReport}
          id="copy-report-button"
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--accent-indigo)"; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
        >
          📋 Copy Report
        </button>
      </div>

      {/* Overall Score + Recommendation */}
      <div className="glass-card" style={{ padding: "32px", display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
        <ScoreBadge score={report.overall_score} label="Overall Score" size="lg" />
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            background: recStyle.bg,
            border: `1px solid ${recStyle.border}`,
            marginBottom: "12px",
          }}>
            <span style={{ fontSize: "16px" }}>{recStyle.icon}</span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: recStyle.color }}>
              {report.recommendation}
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.65" }}>
            {report.executive_summary}
          </p>
        </div>
      </div>

      {/* 3 Score Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {/* Legal */}
        <div className="glass-card animate-fade-in" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "20px" }}>📋</span>
            <span style={{ fontWeight: 600, fontSize: "15px" }}>Legal Risk</span>
          </div>
          <div style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            background: report.legal_summary?.risk_level === "HIGH" ? "rgba(244,63,94,0.1)" :
                        report.legal_summary?.risk_level === "MEDIUM" ? "rgba(245,158,11,0.1)" :
                        report.legal_summary?.risk_level === "LOW" ? "rgba(16,185,129,0.1)" : "rgba(90,90,114,0.1)",
            color: report.legal_summary?.risk_level === "HIGH" ? "#f43f5e" :
                   report.legal_summary?.risk_level === "MEDIUM" ? "#f59e0b" :
                   report.legal_summary?.risk_level === "LOW" ? "#10b981" : "var(--text-muted)",
            marginBottom: "12px",
          }}>
            {report.legal_summary?.risk_level || "N/A"}
          </div>
          {report.legal_summary?.top_concerns && report.legal_summary.top_concerns.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              {report.legal_summary.top_concerns.map((concern, i) => (
                <li key={i} style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "6px" }}>
                  <span style={{ color: "var(--accent-amber)" }}>•</span> {concern}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Finance */}
        <div className="glass-card animate-fade-in-delay" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "20px" }}>📊</span>
            <span style={{ fontWeight: 600, fontSize: "15px" }}>Financial Health</span>
          </div>
          <ScoreBadge score={report.financial_summary?.health_score || 0} label="Health Score" size="sm" />
          {report.financial_summary?.key_signals && report.financial_summary.key_signals.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
              {report.financial_summary.key_signals.slice(0, 4).map((signal, i) => (
                <li key={i} style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "6px" }}>
                  <span style={{ color: "var(--accent-indigo)" }}>•</span> {signal}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Engineering */}
        <div className="glass-card animate-fade-in-delay-2" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "20px" }}>💻</span>
            <span style={{ fontWeight: 600, fontSize: "15px" }}>Engineering</span>
          </div>
          <ScoreBadge score={report.engineering_summary?.eng_score || 0} label="Eng Score" size="sm" />
          {report.engineering_summary?.highlights && report.engineering_summary.highlights.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
              {report.engineering_summary.highlights.slice(0, 4).map((h, i) => (
                <li key={i} style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "6px" }}>
                  <span style={{ color: "var(--accent-cyan)" }}>•</span> {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Flags */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Red Flags */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent-rose)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚠</span> Red Flags
          </h3>
          {report.red_flags.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {report.red_flags.map((flag, i) => (
                <li key={i} style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  padding: "8px 12px",
                  background: "rgba(244, 63, 94, 0.05)",
                  borderRadius: "8px",
                  borderLeft: "3px solid var(--accent-rose)",
                }}>
                  {flag}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No red flags detected 🎉</p>
          )}
        </div>

        {/* Green Flags */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent-emerald)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>✓</span> Green Flags
          </h3>
          {report.green_flags.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {report.green_flags.map((flag, i) => (
                <li key={i} style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  padding: "8px 12px",
                  background: "rgba(16, 185, 129, 0.05)",
                  borderRadius: "8px",
                  borderLeft: "3px solid var(--accent-emerald)",
                }}>
                  {flag}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No green flags detected</p>
          )}
        </div>
      </div>
    </div>
  );
}
