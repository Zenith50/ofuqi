import sampleEnglish from "@/sample-data.json";
import sampleArabic from "@/sample-data-ar.json";
import enLocale from "@/src/i18n/en.json";
import arLocale from "@/src/i18n/ar.json";
import type { AppLocale } from "@/lib/app/content";

export type GeneratorLocale = typeof enLocale;

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

export type CvData = {
  language: AppLocale;
  personal: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    startDate?: string;
    endDate?: string;
    details?: string;
  }>;
  skills: string[];
  certifications?: Array<{
    name: string;
    issuer?: string;
    date?: string;
  }>;
  languages?: Array<{
    name: string;
    level: string;
  }>;
};

export function getDemoCv(locale: AppLocale): CvData {
  return (locale === "ar" ? sampleArabic : sampleEnglish) as CvData;
}

export function getGeneratorLocale(locale: AppLocale) {
  return locale === "ar" ? arLocale : enLocale;
}

export function getPreviewContact(data: CvData): string[] {
  return [
    data.personal.email,
    data.personal.phone,
    data.personal.location,
    data.personal.linkedin,
    data.personal.website,
  ].filter(isNonEmptyString);
}

export function safeDownloadName(name: string) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 48) || "cv";
}
