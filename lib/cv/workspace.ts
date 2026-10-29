import type { AppLocale } from "@/lib/app/content";
import type { CvData } from "@/lib/cv/demoData";

export type WorkspaceInstructionResult = {
  nextData: CvData;
  assistantReply: string;
  status: "updated" | "translation";
};

const ENGLISH_TRANSLATION_PATTERNS = ["translate to arabic", "translate to english", "switch to arabic", "switch to english"];
const ARABIC_TRANSLATION_PATTERNS = ["ترجم", "حوّل اللغة", "حول اللغة", "النسخة العربية", "النسخة الإنجليزية", "النسخة الانجليزية"];

const ENGLISH_EXECUTIVE_PATTERNS = ["executive", "leadership tone", "senior tone", "make it stronger", "make summary more executive"];
const ARABIC_EXECUTIVE_PATTERNS = ["تنفيذي", "تنفيذية", "قيادي", "القيادة", "أبرز القيادة", "ابرز القيادة"];

const ENGLISH_ACHIEVEMENT_PATTERNS = ["achievement", "quantified", "result", "metric", "impact", "add quantified achievement"];
const ARABIC_ACHIEVEMENT_PATTERNS = ["إنجاز", "انجاز", "رقمي", "نتيجة", "نتائج", "أثر", "اثر", "قياس"];

const ENGLISH_SUMMARY_PATTERNS = ["tighten summary", "shorten summary", "tighten", "shorten", "summary", "make it shorter"];
const ARABIC_SUMMARY_PATTERNS = ["اختصر", "قلص", "لخص", "الملخص", "ملخص"];

const ENGLISH_LEADERSHIP_PATTERNS = ["leadership", "highlight leadership", "stakeholder", "team leadership"];
const ARABIC_LEADERSHIP_PATTERNS = ["قيادة", "قيادي", "أبرز القيادة", "ابرز القيادة", "أصحاب المصلحة"];

export function cloneCvData(data: CvData): CvData {
  return JSON.parse(JSON.stringify(data)) as CvData;
}

const PERSONAL_FIELDS = ["fullName", "jobTitle", "email", "phone", "location", "linkedin", "website"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) return null;
  return [...value];
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined | null {
  if (!(key in record)) return undefined;
  return typeof record[key] === "string" ? record[key] : null;
}

function readList<T>(value: unknown, readItem: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const items: T[] = [];
  for (const entry of value) {
    const item = readItem(entry);
    if (!item) return null;
    items.push(item);
  }
  return items;
}

function readExperienceItem(value: unknown): CvData["experience"][number] | null {
  if (!isRecord(value)) return null;
  const { company, role, startDate, endDate, achievements } = value;
  const achievementList = readStringList(achievements);
  if (
    typeof company !== "string" ||
    typeof role !== "string" ||
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    !achievementList
  ) {
    return null;
  }

  return { company, role, startDate, endDate, achievements: achievementList };
}

function readEducationItem(value: unknown): CvData["education"][number] | null {
  if (!isRecord(value)) return null;
  const { institution, degree } = value;
  if (typeof institution !== "string" || typeof degree !== "string") return null;

  const startDate = readOptionalString(value, "startDate");
  const endDate = readOptionalString(value, "endDate");
  const details = readOptionalString(value, "details");
  if (startDate === null || endDate === null || details === null) return null;

  return {
    institution,
    degree,
    ...(startDate === undefined ? {} : { startDate }),
    ...(endDate === undefined ? {} : { endDate }),
    ...(details === undefined ? {} : { details }),
  };
}

function readCertificationItem(value: unknown): NonNullable<CvData["certifications"]>[number] | null {
  if (!isRecord(value) || typeof value.name !== "string") return null;
  const issuer = readOptionalString(value, "issuer");
  const date = readOptionalString(value, "date");
  if (issuer === null || date === null) return null;

  return {
    name: value.name,
    ...(issuer === undefined ? {} : { issuer }),
    ...(date === undefined ? {} : { date }),
  };
}

function readLanguageItem(value: unknown): NonNullable<CvData["languages"]>[number] | null {
  if (!isRecord(value)) return null;
  const { name, level } = value;
  if (typeof name !== "string" || typeof level !== "string") return null;
  return { name, level };
}

function mergePersonal(current: CvData["personal"], source: unknown): CvData["personal"] {
  if (!isRecord(source)) return current;

  const next: CvData["personal"] = { ...current };
  for (const field of PERSONAL_FIELDS) {
    const value = source[field];
    if (typeof value === "string") next[field] = value;
  }
  return next;
}

export function deepMerge(target: CvData, source: unknown): CvData {
  const result = cloneCvData(target);
  if (!isRecord(source)) return result;

  if (source.language === "en" || source.language === "ar") result.language = source.language;
  if (typeof source.summary === "string") result.summary = source.summary;

  result.personal = mergePersonal(result.personal, source.personal);

  const experience = readList(source.experience, readExperienceItem);
  if (experience !== null) result.experience = experience;

  const education = readList(source.education, readEducationItem);
  if (education !== null) result.education = education;

  const skills = readStringList(source.skills);
  if (skills !== null) result.skills = skills;

  const certifications = readList(source.certifications, readCertificationItem);
  if (certifications !== null) result.certifications = certifications;

  const languages = readList(source.languages, readLanguageItem);
  if (languages !== null) result.languages = languages;

  return result;
}

export function applyWorkspaceInstruction(
  data: CvData,
  locale: AppLocale,
  instruction: string,
): WorkspaceInstructionResult {
  const nextData = cloneCvData(data);
  const trimmedInstruction = instruction.trim();
  const lowerInstruction = trimmedInstruction.toLowerCase();

  if (matchesTranslationRequest(locale, lowerInstruction, trimmedInstruction)) {
    return {
      nextData,
      assistantReply:
        locale === "ar"
          ? "أستطيع تجهيز نفس المسودة بالعربية أو الإنجليزية، لكن تبديل النسخة نفسها يتم من زر اللغة في أعلى الصفحة حتى تبقى الواجهة والمعاينة متطابقتين."
          : "I can prepare the same draft in Arabic or English, but the actual draft switch now happens through the header language toggle so the workspace and preview stay in sync.",
      status: "translation",
    };
  }

  const appliedChanges: string[] = [];
  const focusText = sanitizeFocusText(trimmedInstruction);

  if (matchesExecutiveRequest(locale, lowerInstruction, trimmedInstruction)) {
    nextData.summary = buildExecutiveSummary(nextData, locale);
    appliedChanges.push(
      locale === "ar"
        ? "حدّثت الملخص بنبرة أكثر تنفيذية"
        : "I rewrote the summary in a more executive tone",
    );
  }

  if (matchesSummaryRequest(locale, lowerInstruction, trimmedInstruction)) {
    nextData.summary = buildTightSummary(nextData, locale);
    appliedChanges.push(
      locale === "ar" ? "اختصرت الملخص ليصبح أوضح وأسرع في القراءة" : "I tightened the summary for faster scanning",
    );
  }

  if (matchesLeadershipRequest(locale, lowerInstruction, trimmedInstruction)) {
    const leadershipSkill = locale === "ar" ? "قيادة أصحاب المصلحة التنفيذيين" : "Executive Stakeholder Leadership";

    if (!nextData.skills.includes(leadershipSkill)) {
      nextData.skills = [leadershipSkill, ...nextData.skills];
    }

    if (!nextData.summary.includes(leadershipSkill) && !matchesExecutiveRequest(locale, lowerInstruction, trimmedInstruction)) {
      nextData.summary =
        locale === "ar"
          ? `${buildTightSummary(nextData, locale)} مع إبراز قيادة الفرق والتواصل مع أصحاب المصلحة التنفيذيين.`
          : `${buildTightSummary(nextData, locale)} It now emphasizes team leadership and executive stakeholder management.`;
    }

    appliedChanges.push(
      locale === "ar" ? "أضفت تركيزا أوضح على القيادة داخل المهارات والملخص" : "I highlighted leadership in the skills and summary",
    );
  }

  if (matchesAchievementRequest(locale, lowerInstruction, trimmedInstruction)) {
    if (nextData.experience[0]) {
      appliedChanges.push(
        locale === "ar"
          ? "ما أضفت رقما. اذكر نتيجة يمكنك الدفاع عنها، مثل نسبة أو مدة أو حجم فريق أو إيراد، وسأكتبها كما قلتها"
          : "I did not add a number. Tell me a result you can defend, such as a percentage, time saved, team size, or revenue, and I will use your words",
      );
    }
  }

  if (appliedChanges.length === 0) {
    nextData.summary = buildFocusedSummary(nextData, locale, focusText);
    appliedChanges.push(
      locale === "ar"
        ? `أعدت توجيه السرد المهني ليبرز ${focusText}`
        : `I refocused the narrative to emphasize ${focusText}`,
    );
  }

  return {
    nextData,
    assistantReply: buildAssistantReply(locale, appliedChanges),
    status: "updated",
  };
}

function matchesTranslationRequest(locale: AppLocale, lowerInstruction: string, instruction: string) {
  return locale === "ar"
    ? ARABIC_TRANSLATION_PATTERNS.some((pattern) => instruction.includes(pattern))
    : ENGLISH_TRANSLATION_PATTERNS.some((pattern) => lowerInstruction.includes(pattern));
}

function matchesExecutiveRequest(locale: AppLocale, lowerInstruction: string, instruction: string) {
  return locale === "ar"
    ? ARABIC_EXECUTIVE_PATTERNS.some((pattern) => instruction.includes(pattern))
    : ENGLISH_EXECUTIVE_PATTERNS.some((pattern) => lowerInstruction.includes(pattern));
}

function matchesAchievementRequest(locale: AppLocale, lowerInstruction: string, instruction: string) {
  return locale === "ar"
    ? ARABIC_ACHIEVEMENT_PATTERNS.some((pattern) => instruction.includes(pattern))
    : ENGLISH_ACHIEVEMENT_PATTERNS.some((pattern) => lowerInstruction.includes(pattern));
}

function matchesSummaryRequest(locale: AppLocale, lowerInstruction: string, instruction: string) {
  return locale === "ar"
    ? ARABIC_SUMMARY_PATTERNS.some((pattern) => instruction.includes(pattern))
    : ENGLISH_SUMMARY_PATTERNS.some((pattern) => lowerInstruction.includes(pattern));
}

function matchesLeadershipRequest(locale: AppLocale, lowerInstruction: string, instruction: string) {
  return locale === "ar"
    ? ARABIC_LEADERSHIP_PATTERNS.some((pattern) => instruction.includes(pattern))
    : ENGLISH_LEADERSHIP_PATTERNS.some((pattern) => lowerInstruction.includes(pattern));
}

function buildExecutiveSummary(data: CvData, locale: AppLocale) {
  const role = data.personal.jobTitle || data.experience[0]?.role || (locale === "ar" ? "هذا الملف" : "This profile");

  return locale === "ar"
    ? `${role} بخبرة قيادية تركّز على تحويل الأولويات المعقدة إلى نتائج قابلة للقياس، مع وضوح أعلى للإدارة التنفيذية وانضباط أقوى في التنفيذ. يجمع هذا الملف بين إدارة الفرق، ورفع جودة القرارات، والحفاظ على سرعة الإنجاز دون التضحية بالثقة أو الجودة.`
    : `${role} with a leadership-focused track record of turning complex priorities into measurable results, stronger executive visibility, and more disciplined delivery. This profile now emphasizes team direction, decision quality, and clear stakeholder management across high-impact work.`;
}

function buildTightSummary(data: CvData, locale: AppLocale) {
  const role = data.personal.jobTitle || data.experience[0]?.role || (locale === "ar" ? "هذا الملف" : "This profile");

  return locale === "ar"
    ? `${role} بخبرة قوية في قيادة التنفيذ وتحقيق نتائج قابلة للقياس مع تواصل واضح وإيقاع عمل منظم.`
    : `${role} with a strong record of leading execution, driving measurable results, and communicating clearly with stakeholders.`;
}

function buildFocusedSummary(data: CvData, locale: AppLocale, focusText: string) {
  const baseSummary = buildTightSummary(data, locale);

  return locale === "ar"
    ? `${baseSummary} وتبرز هذه النسخة بشكل أوضح ${focusText}.`
    : `${baseSummary} This revision now places clearer emphasis on ${focusText}.`;
}

function buildAssistantReply(locale: AppLocale, appliedChanges: string[]) {
  if (locale === "ar") {
    return `تم. ${appliedChanges.join(". ")}. راجع المعاينة على اليمين وسترى أن المسودة تغيرت مباشرة.`;
  }

  return `Done. ${appliedChanges.join(". ")}. Check the preview on the right and you will see the draft update immediately.`;
}

function sanitizeFocusText(value: string) {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim() || "the strongest measurable work";
}
