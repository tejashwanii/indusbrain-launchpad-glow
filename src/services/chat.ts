export interface ChatSource {
  chunk_id: string;
  similarity_score: number;
  document_name?: string;
  metadata: Record<string, unknown>;
}

export interface ChatResponse {
  question: string;
  answer: string;
  confidence: number;
  confidence_level: string;
  sources: ChatSource[];
}

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function askQuestion(
  question: string,
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error("Unable to contact AI service.");
  }

  return response.json();
}