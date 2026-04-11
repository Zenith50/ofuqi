export const CV_TEMPLATE_KEYS = ["ats", "harvard", "ada"] as const;

export type CvProjectTemplateKey = (typeof CV_TEMPLATE_KEYS)[number];

const CV_TEMPLATE_ALIASES: Record<string, CvProjectTemplateKey> = {
  monolith: "harvard",
  berlin: "ats",
  studio: "ada",
  ats3: "ats",
};

export function isCvProjectTemplateKey(value: string | null | undefined): value is CvProjectTemplateKey {
  return value === "ats" || value === "harvard" || value === "ada";
}

export function resolveCvProjectTemplateKey(value: string | null | undefined): CvProjectTemplateKey | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (isCvProjectTemplateKey(normalized)) {
    return normalized;
  }

  return CV_TEMPLATE_ALIASES[normalized] ?? null;
}

export function getCvTemplateStageClassName(templateKey: CvProjectTemplateKey) {
  switch (templateKey) {
    case "harvard":
      return "gallery-stage gallery-stage--harvard";
    case "ada":
      return "gallery-stage gallery-stage--ada";
    case "ats":
    default:
      return "gallery-stage gallery-stage--ats";
  }
}
