import sampleEnglish from "@/sample-data.json";
import sampleArabicEngineer from "@/sample-data-ar-simple.json";
import sampleArabicSales from "@/sample-data-ar.json";
import sampleArabicMarketing from "@/sample-data-ar-marketing.json";
import type { AppLocale } from "@/lib/app/content";
import type { CvData } from "@/lib/cv/demoData";
import { resolveCvProjectTemplateKey, type CvProjectTemplateKey } from "@/lib/cv/templates";
import { cloneCvData } from "@/lib/cv/workspace";

export { isCvProjectTemplateKey, resolveCvProjectTemplateKey, type CvProjectTemplateKey } from "@/lib/cv/templates";

export type CvProjectStatusKey = "ready" | "draft" | "review";
export type CvProjectUpdatedKey = "today" | "recent" | "week";

export type CvProjectSharedMetadata = {
  templateKey: CvProjectTemplateKey;
  statusKey: CvProjectStatusKey;
  updatedKey: CvProjectUpdatedKey;
  defaultLanguage: AppLocale;
  availableLanguages: AppLocale[];
};

export type CvProjectMessage = {
  role: "assistant" | "user";
  body: string;
  language: AppLocale;
  seedKey?: "welcome" | "userExample" | "followUp";
};

export type DemoCvProject = {
  id: string;
  shared: CvProjectSharedMetadata;
  variant: CvData;
  conversation: { messages: CvProjectMessage[]; historyItems: string[] };
  translationCache?: unknown;
};

export type ConvexCvProjectRow = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readMessages(value: unknown): CvProjectMessage[] {
  if (!isRecord(value) || !Array.isArray(value.messages)) return [];

  return value.messages.filter((message): message is CvProjectMessage => {
    if (!isRecord(message)) return false;
    const role = message.role === "assistant" || message.role === "user";
    const language = message.language === "en" || message.language === "ar";
    const seedKey = message.seedKey === undefined || message.seedKey === "welcome" || message.seedKey === "userExample" || message.seedKey === "followUp";
    return role && language && seedKey && typeof message.body === "string";
  });
}

function readHistoryItems(value: unknown): string[] {
  return isRecord(value) && Array.isArray(value.historyItems)
    ? value.historyItems.filter((item): item is string => typeof item === "string")
    : [];
}

function readLocales(value: unknown): AppLocale[] {
  if (!Array.isArray(value)) return ["en", "ar"];
  const locales = value.filter((item): item is AppLocale => item === "en" || item === "ar");
  return locales.length > 0 ? locales : ["en", "ar"];
}

function computeUpdatedKey(updatedAt: number): CvProjectUpdatedKey {
  const now = Date.now();
  const diffHours = (now - updatedAt) / (1000 * 60 * 60);
  if (diffHours < 24) return "today";
  if (diffHours < 72) return "recent";
  return "week";
}

export function convexRowToProject(row: ConvexCvProjectRow): DemoCvProject {
  const defaultLang = (row.defaultLanguage === "ar" || row.defaultLanguage === "en" ? row.defaultLanguage : "en") as AppLocale;
  const legacyVariant = defaultLang === "ar" ? row.variantAr : row.variantEn;
  const legacyConversation = defaultLang === "ar" ? row.conversationAr : row.conversationEn;
  const currentMessages = readMessages(row.conversation);
  const currentHistory = readHistoryItems(row.conversation);

  return {
    id: row._id as string,
    shared: {
      templateKey: (row.templateKey ?? "ats") as CvProjectTemplateKey,
      statusKey: (row.statusKey ?? "draft") as CvProjectStatusKey,
      updatedKey: computeUpdatedKey(typeof row.updatedAt === "number" ? row.updatedAt : Date.now()),
      defaultLanguage: defaultLang,
      availableLanguages: readLocales(row.availableLanguages),
    },
    variant: (row.variant ?? legacyVariant ?? { language: defaultLang, personal: { fullName: "", jobTitle: "" }, summary: "", experience: [], education: [], skills: [] }) as CvData,
    conversation: {
      messages: currentMessages.length > 0 ? currentMessages : readMessages(legacyConversation),
      historyItems: currentHistory.length > 0 ? currentHistory : readHistoryItems(legacyConversation),
    },
    translationCache: row.translationCache,
  };
}

type LegacyDraftRoute = {
  projectId: string;
  language: AppLocale;
};

const PROJECT_LANGUAGES: AppLocale[] = ["en", "ar"];

function withLanguage(language: AppLocale, data: CvData) {
  const nextData = cloneCvData(data);
  nextData.language = language;
  return nextData;
}

function cloneProject(project: DemoCvProject): DemoCvProject {
  return {
    id: project.id,
    shared: {
      ...project.shared,
      availableLanguages: [...project.shared.availableLanguages],
    },
    variant: withLanguage(project.shared.defaultLanguage, project.variant),
    conversation: { messages: [], historyItems: [] },
  };
}

function createProject(project: DemoCvProject): DemoCvProject {
  return cloneProject(project);
}

const englishEngineer = sampleEnglish as CvData;
export const arabicEngineer = sampleArabicEngineer as CvData;
const arabicSales = sampleArabicSales as CvData;
const arabicMarketing = sampleArabicMarketing as CvData;

export const englishSales: CvData = {
  language: "en",
  personal: {
    fullName: "Abdullah Mohammed Al-Shamri",
    jobTitle: "Regional Sales Director",
    email: "abdullah.shamri@email.com",
    phone: "+966 54 321 9876",
    location: "Jeddah, Saudi Arabia",
    linkedin: "linkedin.com/in/abdullahshamri",
  },
  summary:
    "Regional Sales Director with more than 10 years of experience leading sales teams and developing business across retail, technology, and financial services. Proven record of outperforming revenue targets, building strategic client relationships, and expanding market share across highly competitive regions.",
  experience: [
    {
      company: "Al Ofoq Technology Solutions",
      role: "Regional Sales Director",
      startDate: "January 2020",
      endDate: "Present",
      achievements: [
        "Led a 12-person regional sales team across western Saudi Arabia and grew annual revenue by 38% in the first two years.",
        "Closed strategic agreements with 8 government-sector clients worth more than SAR 15 million in total.",
        "Designed a new incentive model that cut team attrition by 45% while improving individual quota attainment.",
        "Launched a distributor partnership program that expanded active coverage into 4 additional cities.",
      ],
    },
    {
      company: "Al Masar Trading Group",
      role: "Senior Sales Supervisor",
      startDate: "March 2016",
      endDate: "December 2019",
      achievements: [
        "Led a team of 6 representatives and exceeded quarterly targets in 14 out of 16 consecutive quarters.",
        "Built a small-retail market penetration plan that increased active points of sale from 120 to 340 over two years.",
        "Improved lead follow-up discipline and lifted conversion from 18% to 31%.",
        "Coached 4 new representatives who later moved into leadership roles inside the business.",
      ],
    },
    {
      company: "Bayan Communications",
      role: "Sales Representative",
      startDate: "June 2013",
      endDate: "February 2016",
      achievements: [
        "Ranked first across the region in sales performance for 3 consecutive quarters.",
        "Built a book of more than 200 active SMB accounts across the corporate segment.",
        "Supported the launch of 3 new products and achieved the initial sales targets within the first 90 days.",
      ],
    },
  ],
  education: [
    {
      institution: "King Abdulaziz University",
      degree: "Bachelor of Business Administration, Marketing",
      startDate: "2009",
      endDate: "2013",
      details: "Capstone focused on sales strategies in the Saudi market with practical retail-sector applications.",
    },
  ],
  skills: [
    "Sales Team Leadership",
    "Business Development",
    "Negotiation and Deal Closing",
    "Strategic Account Management",
    "Salesforce",
    "HubSpot CRM",
    "Territory Planning",
    "Sales Analytics",
    "Channel Management",
    "Coaching and Team Development",
  ],
  certifications: [
    {
      name: "Certified Sales Leadership Professional",
      issuer: "Sales Management Association",
      date: "2023",
    },
    {
      name: "HubSpot Sales Software Certification",
      issuer: "HubSpot Academy",
      date: "2022",
    },
  ],
  languages: [
    {
      name: "Arabic",
      level: "Native",
    },
    {
      name: "English",
      level: "Advanced",
    },
  ],
};

export const englishMarketing: CvData = {
  language: "en",
  personal: {
    fullName: "Reem Khalid Al-Otaibi",
    jobTitle: "Digital Marketing Director",
    email: "reem.alotaibi@email.com",
    phone: "+966 55 482 1934",
    location: "Riyadh, Saudi Arabia",
    linkedin: "linkedin.com/in/reem-alotaibi",
    website: "reemdigital.me",
  },
  summary:
    "Digital Marketing Director with 12 years of experience building integrated growth strategies for e-commerce, retail, and service brands. Leads performance, content, and CRM teams with a consistent focus on profitable growth, lower acquisition cost, and higher customer lifetime value.",
  experience: [
    {
      company: "Nomo E-Commerce",
      role: "Digital Marketing Director",
      startDate: "February 2020",
      endDate: "Present",
      achievements: [
        "Led a multi-channel growth strategy that increased direct annual campaign revenue by 46% within 18 months.",
        "Rebalanced spend across Google Ads, Meta, and TikTok and reduced acquisition cost by 29% while sustaining sales growth.",
        "Built an email automation and audience segmentation program that increased repeat purchases by 21% and average order value by 13%.",
        "Created weekly executive dashboards linking marketing spend to revenue, conversion rate, and margin by channel.",
      ],
    },
    {
      company: "Roshan Media Group",
      role: "Performance and Acquisition Manager",
      startDate: "June 2016",
      endDate: "January 2020",
      achievements: [
        "Managed a team of 6 specialists across performance marketing, SEO, and analytics and introduced one operating rhythm for monthly campaigns.",
        "Launched subscription-focused campaigns for 3 sub-brands and grew new-customer volume by 58% in the first year.",
        "Partnered with product to improve landing pages and conversion paths, increasing conversion from 2.3% to 3.9%.",
        "Built a practical channel-attribution model that improved budget decisions and reduced low-return spend.",
      ],
    },
    {
      company: "Athar Marketing Solutions",
      role: "Digital Marketing Specialist",
      startDate: "September 2012",
      endDate: "May 2016",
      achievements: [
        "Managed more than 25 client accounts across education, real estate, and hospitality while staying ahead of delivery timelines and KPIs.",
        "Ran content and paid-media campaigns that lifted qualified traffic by 34% across priority accounts.",
        "Prepared clear monthly client reporting that connected campaign results to business outcomes and next-quarter opportunities.",
      ],
    },
  ],
  education: [
    {
      institution: "King Saud University",
      degree: "Bachelor of Business Administration, Marketing",
      startDate: "2008",
      endDate: "2012",
      details: "Graduation project explored digital consumer behavior in Saudi Arabia and its effect on online purchasing decisions.",
    },
  ],
  skills: [
    "Digital Marketing Strategy",
    "Paid Media Budget Management",
    "Google Ads",
    "Meta Ads",
    "SEO",
    "SEM",
    "Email Automation",
    "Marketing Analytics",
    "Executive Reporting",
    "Conversion Rate Optimization",
    "Marketing Team Leadership",
    "CRM Management",
  ],
  certifications: [
    {
      name: "Google Ads Search Certification",
      issuer: "Google",
      date: "2024",
    },
    {
      name: "Meta Media Buying Professional Certificate",
      issuer: "Meta",
      date: "2023",
    },
    {
      name: "HubSpot Email Marketing Certification",
      issuer: "HubSpot Academy",
      date: "2022",
    },
  ],
  languages: [
    {
      name: "Arabic",
      level: "Native",
    },
    {
      name: "English",
      level: "Full professional proficiency",
    },
  ],
};

export const demoProjects = [
  createProject({
    id: "khalid-engineer",
    shared: {
      templateKey: "harvard",
      statusKey: "ready",
      updatedKey: "today",
      defaultLanguage: "en",
      availableLanguages: PROJECT_LANGUAGES,
    },
    variant: englishEngineer,
    conversation: { messages: [], historyItems: [] },
  }),
  createProject({
    id: "abdullah-sales",
    shared: {
      templateKey: "ats",
      statusKey: "review",
      updatedKey: "recent",
      defaultLanguage: "ar",
      availableLanguages: PROJECT_LANGUAGES,
    },
    variant: arabicSales,
    conversation: { messages: [], historyItems: [] },
  }),
  createProject({
    id: "reem-marketing",
    shared: {
      templateKey: "ada",
      statusKey: "draft",
      updatedKey: "week",
      defaultLanguage: "ar",
      availableLanguages: PROJECT_LANGUAGES,
    },
    variant: arabicMarketing,
    conversation: { messages: [], historyItems: [] },
  }),
];

const legacyDraftRoutes: Record<string, LegacyDraftRoute> = {
  "khalid-executive": {
    projectId: "khalid-engineer",
    language: "en",
  },
  "abdullah-arabic": {
    projectId: "abdullah-sales",
    language: "ar",
  },
  "maya-ops": {
    projectId: "reem-marketing",
    language: "en",
  },
};

export function resolveLegacyDraftRoute(draftId: string | null | undefined) {
  return draftId ? legacyDraftRoutes[draftId] ?? null : null;
}

export function createStarterCvProject(templateKey: CvProjectTemplateKey = "ats", locale?: AppLocale | null): DemoCvProject {
  const resolvedTemplateKey = resolveCvProjectTemplateKey(templateKey) ?? "ats";
  const resolvedLanguage = locale ?? "en";
  
  const emptyData: CvData = { language: resolvedLanguage, personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "", linkedin: "", website: "" }, summary: "", experience: [], education: [], skills: [], languages: [], certifications: [] };

  return {
    id: `starter-${resolvedTemplateKey}`,
    shared: {
      templateKey: resolvedTemplateKey,
      statusKey: "draft",
      updatedKey: "today",
      defaultLanguage: resolvedLanguage,
      availableLanguages: PROJECT_LANGUAGES,
    },
    variant: emptyData,
    conversation: { messages: [], historyItems: [] },
  };
}

export function resolveProjectLanguage(
  project: DemoCvProject,
  requestedLanguage: string | null | undefined,
  fallbackLanguage?: AppLocale | null,
) {
  if (requestedLanguage === "en" || requestedLanguage === "ar") {
    if (project.shared.availableLanguages.includes(requestedLanguage)) {
      return requestedLanguage;
    }
  }

  if (fallbackLanguage && project.shared.availableLanguages.includes(fallbackLanguage)) {
    return fallbackLanguage;
  }

  return project.shared.defaultLanguage;
}

export function getProjectVariant(project: DemoCvProject) {
  return project.variant;
}

export function buildWorkspaceHref({
  language,
  projectId,
  templateKey,
}: {
  language?: AppLocale | null;
  projectId?: string | null;
  templateKey?: CvProjectTemplateKey | null;
}) {
  const searchParams = new URLSearchParams();

  if (projectId) {
    searchParams.set("project", projectId);
  } else if (templateKey) {
    searchParams.set("template", templateKey);
  }

  if (language) {
    searchParams.set("lang", language);
  }

  const query = searchParams.toString();
  return query ? `/chat/new?${query}` : "/chat/new";
}
