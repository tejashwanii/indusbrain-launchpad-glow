export interface ComplianceStandard {
  name: string;
  score: number | null;
  status: "Compliant" | "Needs Review" | "Needs Improvement" | "Not Evaluated";
  reason: string;
}

export interface ComplianceResponse {
  overall: number | null;
  standards: ComplianceStandard[];
  message?: string | null;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function getCompliance(): Promise<ComplianceResponse> {
  const response = await fetch(`${API_URL}/compliance`);
  if (!response.ok) throw new Error("Unable to load compliance assessment.");
  return response.json();
}
