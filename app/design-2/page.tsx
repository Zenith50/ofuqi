"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileDown,
  Gauge,
  Globe2,
  Languages,
  MessageSquare,
  PenLine,
  Rows3,
  Search,
  Send,
  Shield,
} from "lucide-react";

import CvPreview from "@/components/cv/CvPreview";
import LocaleToggle from "@/components/ui/LocaleToggle";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy, type AppLocale } from "@/lib/app/content";
import { getDemoCv, getGeneratorLocale } from "@/lib/cv/demoData";
import type { CvProjectTemplateKey } from "@/lib/cv/templates";

type ReviewMode = "brief" | "rewrite" | "export";
type ExportFormat = "pdf" | "docx";
type ThreadMessage = {
  role: "assistant" | "user";
  body: string;
};

const reviewModes: Array<{ id: ReviewMode; icon: typeof MessageSquare }> = [
  { id: "brief", icon: MessageSquare },
  { id: "rewrite", icon: PenLine },
  { id: "export", icon: FileDown },
];

const localizedCopy = {
  en: {
    modes: {
      brief: "Brief",
      rewrite: "Rewrite",
      export: "Export",
    },
    reviewPath: "Review path",
    documentFrame: "Document frame",
    evidence: "Evidence",
    privateDraft: "Private draft",
    searchPlaceholder: "Search checks, templates, or actions",
    draftLanguage: "Draft language",
    exportReady: "Export package selected",
    exportFormat: "Export format",
    send: "Send",
    queued: "Queued for review",
    composer: "Ask for a stronger summary or bilingual polish...",
    reviewItems: [
      "Role target is visible",
      "Summary has measurable impact",
      "Arabic preview checked",
      "Export package selected",
    ],
    empty: "No matching checks.",
  },
  ar: {
    modes: {
      brief: "الموجز",
      rewrite: "الصياغة",
      export: "التصدير",
    },
    reviewPath: "مسار المراجعة",
    documentFrame: "إطار المستند",
    evidence: "الدليل",
    privateDraft: "مسودة خاصة",
    searchPlaceholder: "ابحث في الفحوصات أو القوالب أو الإجراءات",
    draftLanguage: "لغة المسودة",
    exportReady: "تم اختيار حزمة التصدير",
    exportFormat: "صيغة التصدير",
    send: "إرسال",
    queued: "تمت الإضافة للمراجعة",
    composer: "اطلب ملخصا أقوى أو تحسين الصياغة ثنائية اللغة...",
    reviewItems: [
      "الدور المستهدف واضح",
      "الملخص يحتوي أثرا قابلا للقياس",
      "تمت مراجعة المعاينة العربية",
      "تم اختيار حزمة التصدير",
    ],
    empty: "لا توجد فحوصات مطابقة.",
  },
} satisfies Record<AppLocale, {
  modes: Record<ReviewMode, string>;
  reviewPath: string;
  documentFrame: string;
  evidence: string;
  privateDraft: string;
  searchPlaceholder: string;
  draftLanguage: string;
  exportReady: string;
  exportFormat: string;
  send: string;
  queued: string;
  composer: string;
  reviewItems: string[];
  empty: string;
}>;

export default function DesignTwoPage() {
  const { locale, dir } = useAppLocale();
  const copy = getCopy(locale);
  const local = localizedCopy[locale];
  const [mode, setMode] = useState<ReviewMode>("brief");
  const [templateKey, setTemplateKey] = useState<CvProjectTemplateKey>("ada");
  const [selectedItem, setSelectedItem] = useState(local.reviewItems[1]);
  const [query, setQuery] = useState("");
  const [draftLanguage, setDraftLanguage] = useState<AppLocale>(locale);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [composerValue, setComposerValue] = useState("");
  const [notice, setNotice] = useState(local.exportReady);
  const [messages, setMessages] = useState<ThreadMessage[]>([
    { role: "assistant", body: copy.chat.mockConversation.followUp },
  ]);

  const previewData = useMemo(() => getDemoCv(draftLanguage), [draftLanguage]);
  const previewLocale = useMemo(() => getGeneratorLocale(draftLanguage), [draftLanguage]);
  const filteredReviewItems = useMemo(() => {
    const searchValue = query.trim().toLowerCase();

    if (!searchValue) {
      return local.reviewItems;
    }

    return local.reviewItems.filter((item) => item.toLowerCase().includes(searchValue));
  }, [local.reviewItems, query]);

  const sendComposerMessage = (body: string) => {
    const trimmed = body.trim();

    if (!trimmed) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", body: trimmed },
      { role: "assistant", body: local.queued },
    ]);
    setComposerValue("");
    setNotice(local.queued);
  };

  return (
    <main id="main" className="cmp-d2-shell" dir={dir}>
      <header className="cmp-d2-topbar">
        <Link href="/compare" className="cmp-d2-brand">
          <span>{copy.common.brandMark}</span>
          <strong>{copy.common.brandTitle}</strong>
        </Link>

        <nav className="cmp-d2-mode" aria-label="Design 2 workflow">
          {reviewModes.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={mode === item.id ? "active" : undefined}
                onClick={() => setMode(item.id)}
              >
                <Icon size={16} />
                {local.modes[item.id]}
              </button>
            );
          })}
        </nav>

        <LocaleToggle compact />
      </header>

      <section className="cmp-d2-hero">
        <div className="cmp-d2-hero-copy">
          <p>{copy.chat.workspaceKicker}</p>
          <h1>{copy.chat.sections.previewTitle}</h1>
          <span>{copy.chat.sections.previewSubtitle}</span>
        </div>

        <div className="cmp-d2-status-strip">
          <span><Shield size={15} /> {local.privateDraft}</span>
          <span><Languages size={15} /> {copy.meta.languageName}</span>
          <button
            type="button"
            className="cmp-d2-status-button"
            onClick={() => setDraftLanguage((current) => (current === "en" ? "ar" : "en"))}
          >
            <Globe2 size={15} /> {local.draftLanguage}: {draftLanguage.toUpperCase()}
          </button>
          <span><Gauge size={15} /> {local.modes[mode]}</span>
        </div>
      </section>

      <section className="cmp-d2-layout">
        <aside className="cmp-d2-guidance">
          <div className="cmp-d2-panel-head">
            <p>{local.reviewPath}</p>
            <h2>{selectedItem}</h2>
          </div>

          <label className="cmp-d2-search" htmlFor="cmp-d2-review-search">
            <Search size={15} />
            <input
              id="cmp-d2-review-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={local.searchPlaceholder}
            />
          </label>

          <div className="cmp-d2-review-list">
            {filteredReviewItems.length > 0 ? filteredReviewItems.map((item, index) => (
              <button
                key={item}
                type="button"
                className={selectedItem === item ? "active" : undefined}
                onClick={() => setSelectedItem(item)}
              >
                <span>{index < 2 ? <Check size={14} /> : index + 1}</span>
                {item}
              </button>
            )) : <p className="cmp-d2-empty">{local.empty}</p>}
          </div>

          <div className="cmp-d2-template-list">
            <p>{local.documentFrame}</p>
            {(["ats", "harvard", "ada"] as CvProjectTemplateKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={templateKey === key ? "active" : undefined}
                onClick={() => setTemplateKey(key)}
              >
                <Rows3 size={15} />
                {copy.dashboard.templateNames[key]}
              </button>
            ))}
          </div>
        </aside>

        <section className="cmp-d2-preview-column">
          <div className="cmp-d2-preview-toolbar">
            <div>
              <p>{copy.chat.previewEyebrow}</p>
              <h2>{previewData.personal.fullName}</h2>
            </div>
            <button
              type="button"
              className="button-primary"
              onClick={() => {
                setMode("export");
                setNotice(local.exportReady);
              }}
            >
              {mode === "export" ? `${copy.chat.exportConfirm} ${exportFormat.toUpperCase()}` : copy.chat.exportConfirm}
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="cmp-d2-preview-stage">
            <CvPreview data={previewData} previewLocale={previewLocale} templateKey={templateKey} />
          </div>
        </section>

        <aside className="cmp-d2-evidence">
          <div className="cmp-d2-panel-head">
            <p>{local.evidence}</p>
            <h2>{copy.chat.conversationTitle}</h2>
          </div>

          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="cmp-d2-evidence-item">
              <span>{message.role === "assistant" ? copy.chat.mockConversation.assistantLabel : copy.chat.mockConversation.userLabel}</span>
              <p>{message.body}</p>
            </div>
          ))}

          <div className="cmp-d2-evidence-item">
            <span>{local.exportFormat}</span>
            <p>{exportFormat.toUpperCase()} · {notice}</p>
            <button type="button" onClick={() => setExportFormat("pdf")}>
              {copy.exportDialog.formatPdf}
            </button>
            <button type="button" onClick={() => setExportFormat("docx")}>
              {copy.exportDialog.formatDocx}
            </button>
          </div>

          <textarea
            aria-label={copy.chat.composerPlaceholder}
            value={composerValue}
            placeholder={local.composer}
            onChange={(event) => setComposerValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendComposerMessage(composerValue);
              }
            }}
          />
          <button type="button" className="button-secondary" onClick={() => sendComposerMessage(composerValue)}>
            <Send size={15} />
            {local.send}
          </button>
        </aside>
      </section>
    </main>
  );
}
