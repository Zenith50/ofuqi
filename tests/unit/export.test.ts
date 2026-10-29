import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { buildExportJobs } from "@/lib/cv/export";

const require = createRequire(import.meta.url);
const { PDF_FONTS } = require("../../src/template/styles.js") as {
  PDF_FONTS: { regular: string; bold: string };
};

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

  it("resolves configured PDF fonts to bundled files", () => {
    expect(PDF_FONTS.regular).toBe("Amiri-Regular.ttf");
    expect(PDF_FONTS.bold).toBe("Amiri-Bold.ttf");

    expect(fs.existsSync(path.join(process.cwd(), "fonts", PDF_FONTS.regular))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), "fonts", PDF_FONTS.bold))).toBe(true);
  });
});
