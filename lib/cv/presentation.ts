import type { CvData } from "@/lib/cv/demoData";

type CertificationItem = NonNullable<CvData["certifications"]>[number];
type LanguageItem = NonNullable<CvData["languages"]>[number];

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

export function formatDateRange(startDate?: string, endDate?: string) {
  return [startDate, endDate].filter(isNonEmptyString).join(" - ");
}

export function formatCertification(item: CertificationItem) {
  return [item.name, item.issuer, item.date].filter(isNonEmptyString).join(" - ");
}

export function formatLanguageLevel(item: LanguageItem) {
  return `${item.name} (${item.level})`;
}
