export interface DashboardStats {
  documents_indexed: number;
  indexed_chunks: number;
  ai_queries: number;
  average_response_time: string;
}

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_URL}/dashboard`);

  if (!response.ok) {
    throw new Error("Failed to load dashboard.");
  }

  return response.json();
}