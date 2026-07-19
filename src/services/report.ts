const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function downloadReport(): Promise<void> {
  const response = await fetch(`${API_URL}/report`, {
    method: "GET",
    headers: {
      Accept: "application/pdf",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Unable to export the report.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "indusbrain-report.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
