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

type JsonObject = Record<string, unknown>;

export function deepMerge<T extends JsonObject>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceValue = source[key as keyof T];
    if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue)) {
      result[key as keyof T] = deepMerge((result[key as keyof T] || {}) as JsonObject, sourceValue as JsonObject) as T[keyof T];
    } else {
      result[key as keyof T] = sourceValue as T[keyof T];
    }
  }
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
    const firstExperience = nextData.experience[0];

    if (firstExperience) {
      const achievement = buildQuantifiedAchievement(nextData, locale);

      if (!firstExperience.achievements.includes(achievement)) {
        firstExperience.achievements = [achievement, ...firstExperience.achievements];
      }

      appliedChanges.push(
        locale === "ar" ? "أضفت إنجازا رقميا في أول خبرة" : "I added a quantified achievement to the lead experience entry",
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

function buildQuantifiedAchievement(data: CvData, locale: AppLocale) {
  const roleText = `${data.personal.jobTitle} ${data.experience[0]?.role ?? ""}`.toLowerCase();

  if (locale === "ar") {
    if (roleText.includes("مبيعات")) {
      return "قدت مبادرة لإعادة توزيع الحسابات الرئيسية ورفع متوسط قيمة الصفقات، مما ساهم في تجاوز الهدف السنوي بنسبة 14% خلال دورة واحدة.";
    }

    if (roleText.includes("مهندس") || roleText.includes("هندسة")) {
      return "قدت خطة متابعة يومية أعادت إحدى الحزم الحرجة إلى الجدول الزمني قبل الموعد المتوقع بستة أسابيع مع تقارير أوضح للإدارة التنفيذية.";
    }

    return "قدت مبادرة تشغيلية حسّنت وضوح التقارير ورفعت قابلية التنبؤ بالتسليم وقدمت صورة أدق للإدارة التنفيذية.";
  }

  if (roleText.includes("sales")) {
    return "Exceeded the annual target by 14% after resegmenting key accounts, tightening follow-up cadence, and coaching the field team around higher-value opportunities.";
  }

  if (roleText.includes("engineer") || roleText.includes("construction")) {
    return "Recovered a high-priority workstream by 6 weeks through tighter contractor coordination, daily issue tracking, and clearer executive-ready progress reporting.";
  }

  return "Led a cross-functional improvement initiative that increased delivery predictability and gave leadership a clearer weekly view of progress.";
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
