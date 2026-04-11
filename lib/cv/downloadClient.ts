import type { CvData } from "@/lib/cv/demoData";
import type { CvProjectTemplateKey } from "@/lib/cv/templates";

type DownloadFormat = "pdf" | "docx";

export async function downloadCv(data: CvData, format: DownloadFormat, templateKey: CvProjectTemplateKey = "ats") {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data, format, templateKey }),
  });

  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const disposition = response.headers.get("content-disposition");
  const fallbackExtension = format === "pdf" ? "pdf" : "docx";
  const filenameMatch = disposition?.match(/filename="([^"]+)"/i);
  const filename = filenameMatch?.[1] ?? `cv.${fallbackExtension}`;

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
