import type { AppLocale } from "@/lib/app/content";

export type ExportFormatChoice = "pdf" | "docx" | "both";
export type ExportLanguageChoice = "active" | AppLocale | "both";

export type ExportJob = {
  language: AppLocale;
  format: "pdf" | "docx";
};

export function buildExportJobs(
  formatChoice: ExportFormatChoice,
  languageChoice: ExportLanguageChoice,
  activeDraftLanguage: AppLocale,
): ExportJob[] {
  const formats: Array<"pdf" | "docx"> = formatChoice === "both" ? ["pdf", "docx"] : [formatChoice];
  const languages: AppLocale[] = languageChoice === "active"
    ? [activeDraftLanguage]
    : languageChoice === "both"
      ? ["en", "ar"]
      : [languageChoice];

  return languages.flatMap((language) => formats.map((format) => ({ language, format })));
}
