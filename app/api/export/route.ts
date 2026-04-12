import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";
import { getGeneratorLocale, safeDownloadName, type CvData } from "@/lib/cv/demoData";
import { resolveCvProjectTemplateKey } from "@/lib/cv/templates";

export const runtime = "nodejs";

const require = createRequire(import.meta.url);
const { generateDocx } = require("../../../src/generators/docx.js");
const { generatePdf } = require("../../../src/generators/pdf.js");

type ExportFormat = "pdf" | "docx";

function isSupportedFormat(value: unknown): value is ExportFormat {
  return value === "pdf" || value === "docx";
}

function createAsciiFilename(data: CvData, extension: string, templateKey: string) {
  const fallbackBase = data.language === "ar" ? "cv_ar" : "cv_en";
  const normalizedBase = safeDownloadName(data.personal.fullName)
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  const base = normalizedBase || fallbackBase;
  return `${base}_${templateKey}_${data.language}_web.${extension}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { data?: CvData; format?: ExportFormat; templateKey?: string };

    if (!body.data || !isSupportedFormat(body.format)) {
      return NextResponse.json({ error: "Invalid export payload." }, { status: 400 });
    }

    const data = body.data;
    const format = body.format;
    const templateKey = resolveCvProjectTemplateKey(body.templateKey) ?? "ats";
    const locale = getGeneratorLocale(data.language === "ar" ? "ar" : "en");
    const extension = format === "pdf" ? "pdf" : "docx";
    const tempDirectory = await fs.mkdtemp(path.join(tmpdir(), "oc-cv-maker-"));
    const filename = createAsciiFilename(data, extension, templateKey);
    const outputPath = path.join(tempDirectory, filename);

    try {
      if (format === "pdf") {
        await generatePdf(data, locale, outputPath, templateKey);
      } else {
        await generateDocx(data, locale, outputPath, templateKey);
      }

      const fileBuffer = await fs.readFile(outputPath);

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type":
            format === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } finally {
      await fs.rm(tempDirectory, { recursive: true, force: true });
    }
  } catch (error) {
    console.error("[Export Error]:", error);
    const message = error instanceof Error ? error.message : "Unknown export error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
