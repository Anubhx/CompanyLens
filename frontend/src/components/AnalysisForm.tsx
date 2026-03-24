"use client";

import React, { useState, useRef } from "react";

interface AnalysisFormProps {
  onSubmit: (company: string, githubOrg?: string, contractFile?: File) => void;
  isLoading: boolean;
}

export default function AnalysisForm({ onSubmit, isLoading }: AnalysisFormProps) {
  const [company, setCompany] = useState("");
  const [githubOrg, setGithubOrg] = useState("");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;
    onSubmit(company.trim(), githubOrg.trim() || undefined, contractFile || undefined);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Company Name */}
      <div>
        <label style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          Company Name <span style={{ color: "var(--accent-rose)" }}>*</span>
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Stripe, Notion, Shopify"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          id="company-name-input"
        />
      </div>

      {/* GitHub Org */}
      <div>
        <label style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          GitHub Organization <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(optional)</span>
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. stripe, vercel, facebook"
          value={githubOrg}
          onChange={(e) => setGithubOrg(e.target.value)}
          id="github-org-input"
        />
      </div>

      {/* Contract PDF Upload */}
      <div>
        <label style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          Contract PDF <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none" }}>(optional)</span>
        </label>
        <div
          className={`file-upload ${contractFile ? "has-file" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          id="contract-upload"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => setContractFile(e.target.files?.[0] || null)}
          />
          {contractFile ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "28px" }}>📄</span>
              <span style={{ color: "var(--accent-emerald)", fontWeight: 500, fontSize: "14px" }}>
                {contractFile.name}
              </span>
              <span
                style={{ color: "var(--text-muted)", fontSize: "12px", cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); setContractFile(null); }}
              >
                Click to remove
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "28px", opacity: 0.5 }}>📎</span>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                Drop a contract PDF or click to upload
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                For legal risk analysis
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn-primary"
        disabled={!company.trim() || isLoading}
        id="analyze-button"
        style={{ marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
      >
        {isLoading ? (
          <>
            <span className="pulse-dot" style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "white",
            }} />
            Analyzing...
          </>
        ) : (
          <>
            Analyse Company
            <span style={{ fontSize: "18px" }}>→</span>
          </>
        )}
      </button>
    </form>
  );
}
