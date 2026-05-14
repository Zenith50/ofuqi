import type { AppLocale } from "@/lib/app/content";
import type { CvData } from "@/lib/cv/demoData";

const MAX_TEXT_LENGTH = 5000;
const MAX_LIST_ITEMS = 80;

export type TranslationCacheEntry = {
  language: AppLocale;
  sourceFingerprint: string;
  data: CvData;
};

const TOP_LEVEL_CV_KEYS = new Set([
  "language",
  "personal",
  "summary",
  "experience",
  "education",
  "skills",
  "certifications",
  "languages",
]);

const PERSONAL_KEYS = new Set(["fullName", "jobTitle", "email", "phone", "location", "linkedin", "website"]);
const EXPERIENCE_KEYS = new Set(["company", "role", "startDate", "endDate", "achievements"]);
const EDUCATION_KEYS = new Set(["institution", "degree", "startDate", "endDate", "details"]);
const CERTIFICATION_KEYS = new Set(["name", "issuer", "date"]);
const LANGUAGE_KEYS = new Set(["name", "level"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function normalizeTextArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_LIST_ITEMS)
    .map((item) => normalizeText(item, 1200))
    .filter(Boolean);
}

function normalizeLanguage(value: unknown): AppLocale | null {
  return value === "en" || value === "ar" ? value : null;
}

export function normalizeCvData(value: unknown): CvData | null {
  if (!isRecord(value)) return null;

  const language = normalizeLanguage(value.language);
  const personal = isRecord(value.personal) ? value.personal : null;
  if (!language || !personal) return null;

  return {
    language,
    personal: {
      fullName: normalizeText(personal.fullName, 200),
      jobTitle: normalizeText(personal.jobTitle, 200),
      email: normalizeText(personal.email, 200),
      phone: normalizeText(personal.phone, 100),
      location: normalizeText(personal.location, 200),
      linkedin: normalizeText(personal.linkedin, 300),
      website: normalizeText(personal.website, 300),
    },
    summary: normalizeText(value.summary, 3000),
    experience: normalizeExperience(value.experience),
    education: normalizeEducation(value.education),
    skills: normalizeTextArray(value.skills),
    certifications: normalizeCertifications(value.certifications),
    languages: normalizeLanguages(value.languages),
  };
}

export function normalizeCvPatch(value: unknown): Partial<CvData> | null {
  if (!isRecord(value)) return null;

  const patch: Partial<CvData> = {};
  for (const key of Object.keys(value)) {
    if (!TOP_LEVEL_CV_KEYS.has(key)) return null;
  }

  if ("language" in value) {
    const language = normalizeLanguage(value.language);
    if (!language) return null;
    patch.language = language;
  }

  if ("personal" in value) {
    if (!isRecord(value.personal) || hasUnknownKeys(value.personal, PERSONAL_KEYS)) return null;
    patch.personal = {
      fullName: normalizeText(value.personal.fullName, 200),
      jobTitle: normalizeText(value.personal.jobTitle, 200),
      email: normalizeText(value.personal.email, 200),
      phone: normalizeText(value.personal.phone, 100),
      location: normalizeText(value.personal.location, 200),
      linkedin: normalizeText(value.personal.linkedin, 300),
      website: normalizeText(value.personal.website, 300),
    };
  }

  if ("summary" in value) {
    patch.summary = normalizeText(value.summary, 3000);
  }

  if ("experience" in value) {
    if (!isArrayOfRecordsWithKnownKeys(value.experience, EXPERIENCE_KEYS)) return null;
    patch.experience = normalizeExperience(value.experience);
  }

  if ("education" in value) {
    if (!isArrayOfRecordsWithKnownKeys(value.education, EDUCATION_KEYS)) return null;
    patch.education = normalizeEducation(value.education);
  }

  if ("skills" in value) {
    if (!Array.isArray(value.skills)) return null;
    patch.skills = normalizeTextArray(value.skills);
  }

  if ("certifications" in value) {
    if (!isArrayOfRecordsWithKnownKeys(value.certifications, CERTIFICATION_KEYS)) return null;
    patch.certifications = normalizeCertifications(value.certifications);
  }

  if ("languages" in value) {
    if (!isArrayOfRecordsWithKnownKeys(value.languages, LANGUAGE_KEYS)) return null;
    patch.languages = normalizeLanguages(value.languages);
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export function isCvData(value: unknown): value is CvData {
  return normalizeCvData(value) !== null;
}

export function computeCvFingerprint(data: CvData) {
  return JSON.stringify(normalizeCvData(data) ?? data);
}

export function createTranslationCacheEntry(sourceData: CvData, translatedData: CvData): TranslationCacheEntry {
  return {
    language: translatedData.language,
    sourceFingerprint: computeCvFingerprint(sourceData),
    data: translatedData,
  };
}

export function readFreshTranslationCache(
  cache: unknown,
  sourceData: CvData,
  targetLanguage: AppLocale,
): CvData | null {
  const sourceFingerprint = computeCvFingerprint(sourceData);

  if (isRecord(cache) && isCvData(cache.data)) {
    const language = normalizeLanguage(cache.language);
    const cachedFingerprint = typeof cache.sourceFingerprint === "string" ? cache.sourceFingerprint : null;
    if (language === targetLanguage && cachedFingerprint === sourceFingerprint && cache.data.language === targetLanguage) {
      return cache.data;
    }
  }

  if (isCvData(cache) && cache.language === targetLanguage) {
    return null;
  }

  return null;
}

function normalizeExperience(value: unknown): CvData["experience"] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, MAX_LIST_ITEMS).map((item) => {
    const row = isRecord(item) ? item : {};
    return {
      company: normalizeText(row.company, 200),
      role: normalizeText(row.role, 200),
      startDate: normalizeText(row.startDate, 80),
      endDate: normalizeText(row.endDate, 80),
      achievements: normalizeTextArray(row.achievements),
    };
  });
}

function normalizeEducation(value: unknown): CvData["education"] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, MAX_LIST_ITEMS).map((item) => {
    const row = isRecord(item) ? item : {};
    return {
      institution: normalizeText(row.institution, 200),
      degree: normalizeText(row.degree, 200),
      startDate: normalizeText(row.startDate, 80),
      endDate: normalizeText(row.endDate, 80),
      details: normalizeText(row.details, 1000),
    };
  });
}

function normalizeCertifications(value: unknown): CvData["certifications"] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, MAX_LIST_ITEMS).map((item) => {
    const row = isRecord(item) ? item : {};
    return {
      name: normalizeText(row.name, 200),
      issuer: normalizeText(row.issuer, 200),
      date: normalizeText(row.date, 80),
    };
  });
}

function normalizeLanguages(value: unknown): CvData["languages"] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, MAX_LIST_ITEMS).map((item) => {
    const row = isRecord(item) ? item : {};
    return {
      name: normalizeText(row.name, 120),
      level: normalizeText(row.level, 120),
    };
  });
}

function hasUnknownKeys(value: Record<string, unknown>, allowedKeys: Set<string>) {
  return Object.keys(value).some((key) => !allowedKeys.has(key));
}

function isArrayOfRecordsWithKnownKeys(value: unknown, allowedKeys: Set<string>) {
  return Array.isArray(value) && value.every((item) => isRecord(item) && !hasUnknownKeys(item, allowedKeys));
}
