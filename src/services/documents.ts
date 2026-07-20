export interface DocumentItem {
  filename: string;
  status: string;
}

export interface DocumentsResponse {
  documents: DocumentItem[];
}

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function getDocuments(): Promise<DocumentsResponse> {
  const response = await fetch(`${API_URL}/documents`);

  if (!response.ok) {
    throw new Error("Failed to load documents.");
  }

  return response.json();
}