const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AnalyzeResponse {
  job_id: string;
  status: string;
  estimated_seconds: number;
}

export interface AgentStatuses {
  legal_scout: string;
  finance_analyst: string;
  dev_scout: string;
}

export interface StatusResponse {
  job_id: string;
  status: string;
  agents: AgentStatuses;
  partial_results: Record<string, unknown>;
}

export interface FinalReport {
  overall_score: number;
  recommendation: string;
  executive_summary: string;
  legal_summary: { risk_level: string; top_concerns: string[] } | null;
  financial_summary: { health_score: number; key_signals: string[] } | null;
  engineering_summary: { eng_score: number; highlights: string[] } | null;
  red_flags: string[];
  green_flags: string[];
  generated_at: string;
}

export interface ReportResponse {
  job_id: string;
  status: string;
  report: FinalReport | null;
}

export async function startAnalysis(
  company: string,
  githubOrg?: string,
  contractFile?: File
): Promise<AnalyzeResponse> {
  if (contractFile) {
    const formData = new FormData();
    formData.append("company", company);
    if (githubOrg) formData.append("github_org", githubOrg);
    formData.append("contract_file", contractFile);

    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`Analysis failed: ${res.statusText}`);
    return res.json();
  } else {
    const res = await fetch(`${API_BASE}/api/analyze/json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company,
        github_org: githubOrg || null,
        contract_url: null,
      }),
    });
    if (!res.ok) throw new Error(`Analysis failed: ${res.statusText}`);
    return res.json();
  }
}

export async function getStatus(jobId: string): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE}/api/status/${jobId}`);
  if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
  return res.json();
}

export async function getReport(jobId: string): Promise<ReportResponse> {
  const res = await fetch(`${API_BASE}/api/report/${jobId}`);
  if (!res.ok) throw new Error(`Report fetch failed: ${res.statusText}`);
  return res.json();
}
