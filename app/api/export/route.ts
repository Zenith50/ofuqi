import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

import { getGeneratorLocale, safeDownloadName, type CvData } from "@/lib/cv/demoData";
import { resolveCvProjectTemplateKey, type CvProjectTemplateKey } from "@/lib/cv/templates";
import { generateDocx } from "@/src/generators/docx";
import { generatePdf } from "@/src/generators/pdf";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow enough time for Sparticuz to download and extract Chromium

const MAX_EXPORT_BODY_BYTES = 512 * 1024;

const TEMP_FILENAMES = {
  en: {
    ats: { pdf: "cv_en_ats.pdf", docx: "cv_en_ats.docx" },
    harvard: { pdf: "cv_en_harvard.pdf", docx: "cv_en_harvard.docx" },
    ada: { pdf: "cv_en_ada.pdf", docx: "cv_en_ada.docx" },
  },
  ar: {
    ats: { pdf: "cv_ar_ats.pdf", docx: "cv_ar_ats.docx" },
    harvard: { pdf: "cv_ar_harvard.pdf", docx: "cv_ar_harvard.docx" },
    ada: { pdf: "cv_ar_ada.pdf", docx: "cv_ar_ada.docx" },
  },
} as const;

type ExportFormat = "pdf" | "docx";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSupportedFormat(value: unknown): value is ExportFormat {
  return value === "pdf" || value === "docx";
}

function isCvLanguage(value: unknown): value is "en" | "ar" {
  return value === "en" || value === "ar";
}

function assertInsideDirectory(parentDirectory: string, candidatePath: string): void {
  const parent = path.resolve(parentDirectory);
  const resolved = path.resolve(candidatePath);
  const relative = path.relative(parent, resolved);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error("Export output path escaped the temp directory.");
  }
}

function createAsciiFilename(
  data: CvData,
  extension: ExportFormat,
  templateKey: CvProjectTemplateKey,
) {
  const fallbackBase = data.language === "ar" ? "cv_ar" : "cv_en";
  const fullName = typeof data.personal?.fullName === "string" ? data.personal.fullName : "";
  const normalizedBase = safeDownloadName(fullName)
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  const base = normalizedBase || fallbackBase;
  const filename = `${base}_${templateKey}_${data.language}_web.${extension}`;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*\.(pdf|docx)$/.test(filename)) {
    return `cv_${data.language}_${templateKey}.${extension}`;
  }
  return filename;
}

async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
      };
    }
    if (Number(declaredLength) > maxBytes) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Payload too large." }, { status: 413 }),
      };
    }
  }

  if (!request.body) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        return {
          ok: false,
          response: NextResponse.json({ error: "Payload too large." }, { status: 413 }),
        };
      }
      chunks.push(value);
    }
  } catch (error) {
    console.error("[Export Error]:", error);
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }
}

export async function POST(request: Request) {
  let tempDirectory: string | undefined;

  try {
    const authenticated = await isAuthenticatedNextjs();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bodyResult = await readJsonBody(request, MAX_EXPORT_BODY_BYTES);
    if (!bodyResult.ok) {
      return bodyResult.response;
    }

    const body = bodyResult.value;
    if (!isRecord(body) || !isRecord(body.data) || !isSupportedFormat(body.format) || !isCvLanguage(body.data.language)) {
      return NextResponse.json({ error: "Invalid export payload." }, { status: 400 });
    }

    const format = body.format;
    const language = body.data.language;
    const templateKey = resolveCvProjectTemplateKey(
      typeof body.templateKey === "string" ? body.templateKey : undefined,
    ) ?? "ats";
    const data = { ...(body.data as CvData), language };
    const locale = getGeneratorLocale(language);
    const extension = format;
    const downloadName = createAsciiFilename(data, extension, templateKey);

    tempDirectory = await fs.mkdtemp(path.join(tmpdir(), "oc-cv-maker-"));
    const tempFilename = TEMP_FILENAMES[language][templateKey][extension];
    const outputPath = path.join(tempDirectory, tempFilename);
    assertInsideDirectory(tempDirectory, outputPath);

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
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Export Error]:", error);
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  } finally {
    if (tempDirectory) {
      await fs.rm(tempDirectory, { recursive: true, force: true }).catch((cleanupError: unknown) => {
        console.error("[Export Error]:", cleanupError);
      });
    }
  }
}
