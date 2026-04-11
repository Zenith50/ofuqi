import { describe, expect, it } from "vitest";
import { buildExportJobs } from "@/lib/cv/export";

describe("buildExportJobs", () => {
  it("builds a single export for the active draft", () => {
    expect(buildExportJobs("pdf", "active", "en")).toEqual([{ language: "en", format: "pdf" }]);
  });

  it("builds both formats for both languages in a stable order", () => {
    expect(buildExportJobs("both", "both", "ar")).toEqual([
      { language: "en", format: "pdf" },
      { language: "en", format: "docx" },
      { language: "ar", format: "pdf" },
      { language: "ar", format: "docx" },
    ]);
  });
});
