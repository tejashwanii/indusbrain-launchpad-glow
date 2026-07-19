export interface UploadResponse {
  document_id: string;
  filename: string;
  status: string;
}

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function uploadDocument(
  file: File,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Upload failed.");
  }

  return response.json();
}