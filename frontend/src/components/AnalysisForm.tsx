"use client";

import React, { useState, useRef } from "react";
import { ArrowRight, FileText, Upload, CheckCircle2, AlertCircle } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="space-y-5 font-body">
      {/* Company Name */}
      <div>
        <label className="block text-xs font-mono font-bold text-[var(--color-bone-muted)] mb-2 uppercase tracking-wider">
          TARGET COMPANY NAME <span className="text-[var(--color-redaction)]">*</span>
        </label>
        <input
          type="text"
          className="input-under"
          placeholder="e.g. Stripe, Notion, Vercel"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          id="company-name-input"
        />
      </div>

      {/* GitHub Org */}
      <div>
        <label className="block text-xs font-mono font-bold text-[var(--color-bone-muted)] mb-2 uppercase tracking-wider">
          GITHUB ORGANIZATION <span className="text-[var(--color-bone-muted)] font-normal lowercase">(optional)</span>
        </label>
        <input
          type="text"
          className="input-under font-mono text-xs"
          placeholder="e.g. stripe, vercel, facebook"
          value={githubOrg}
          onChange={(e) => setGithubOrg(e.target.value)}
          id="github-org-input"
        />
      </div>

      {/* Contract PDF Upload */}
      <div>
        <label className="block text-xs font-mono font-bold text-[var(--color-bone-muted)] mb-2 uppercase tracking-wider">
          CONTRACT PDF FOR LEGAL SCOUT <span className="text-[var(--color-bone-muted)] font-normal lowercase">(optional)</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          id="contract-upload"
          className={`p-4 rounded border border-dashed text-center cursor-pointer transition-all ${
            contractFile
              ? "border-[var(--color-verdigris)] bg-[rgba(76,122,102,0.1)]"
              : "border-[var(--color-kraft-subtle)] bg-[var(--color-ink)] hover:border-[var(--color-kraft)]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setContractFile(e.target.files?.[0] || null)}
          />
          {contractFile ? (
            <div className="flex flex-col items-center gap-1 font-mono text-xs">
              <FileText className="text-[var(--color-verdigris)]" size={24} />
              <span className="text-[var(--color-verdigris)] font-bold">{contractFile.name}</span>
              <span
                className="text-[var(--color-bone-muted)] text-[10px] hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setContractFile(null);
                }}
              >
                Remove contract
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 font-mono text-xs">
              <Upload className="text-[var(--color-kraft)] opacity-70" size={20} />
              <span className="text-[var(--color-bone)] font-medium">Drop contract PDF or click to attach</span>
              <span className="text-[var(--color-bone-muted)] text-[10px]">RAG clause risk &amp; indemnification analysis</span>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!company.trim() || isLoading}
        className="btn-telemetry w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        id="analyze-button"
      >
        {isLoading ? (
          <>
            <span className="w-2 h-2 rounded-full bg-[var(--color-ink)] animate-ping" />
            ANALYZING PIPELINE...
          </>
        ) : (
          <>
            RUN DUE DILIGENCE AUDIT
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}
