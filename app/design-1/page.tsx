"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Languages,
  LayoutGrid,
  LayoutTemplate,
  Search,
  Send,
  Settings2,
  Sparkles,
} from "lucide-react";

import CvPreview from "@/components/cv/CvPreview";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy, type AppLocale } from "@/lib/app/content";
import { getDemoCv, getGeneratorLocale } from "@/lib/cv/demoData";
import type { CvProjectTemplateKey } from "@/lib/cv/templates";

type WorkspaceTab = "write" | "templates" | "export";
type ExportFormat = "pdf" | "docx";

const sampleProjects = [
  { id: "lead", name: "Operations Lead CV", role: "Delivery Recovery Lead", template: "ats" as const, status: "Ready" },
  { id: "exec", name: "Executive Profile", role: "Regional Operations Manager", template: "harvard" as const, status: "Review" },
  { id: "growth", name: "Growth CV Arabic", role: "Bilingual Growth Manager", template: "ada" as const, status: "Draft" },
];

const localCopy = {
  en: {
    shell: "Design 1",
    subtitle: "Focused production workspace",
    overview: "Bilingual CV cockpit",
    hero: "Write, compare, and export from one calm workspace.",
    body: "This direction favors dense working surfaces, clear controls, and a preview that stays visible while the user edits.",
    write: "Write",
    templates: "Templates",
    export: "Export",
    search: "Search drafts",
    action: "Apply suggestion",
    composer: "Ask the AI to tighten the summary, add metrics, or translate a section.",
    preview: "Live preview",
    draftLanguage: "Draft language",
    format: "Format",
    selected: "Selected",
    insight: "Current focus",
    insightBody: "Summary needs stronger measurable outcomes.",
    saved: "Prototype state saved locally",
  },
  ar: {
    shell: "\u0627\u0644\u062a\u0635\u0645\u064a\u0645 1",
    subtitle: "\u0645\u0633\u0627\u062d\u0629 \u0639\u0645\u0644 \u0625\u0646\u062a\u0627\u062c\u064a\u0629 \u0645\u0631\u0643\u0632\u0629",
    overview: "\u0644\u0648\u062d\u0629 \u0633\u064a\u0631\u0629 \u062b\u0646\u0627\u0626\u064a\u0629",
    hero: "\u0627\u0643\u062a\u0628 \u0648\u0642\u0627\u0631\u0646 \u0648\u0635\u062f\u0631 \u0645\u0646 \u0645\u0633\u0627\u062d\u0629 \u0648\u0627\u062d\u062f\u0629 \u0647\u0627\u062f\u0626\u0629.",
    body: "\u0647\u0630\u0627 \u0627\u0644\u0627\u062a\u062c\u0627\u0647 \u064a\u0631\u0643\u0632 \u0639\u0644\u0649 \u0633\u0637\u062d \u0639\u0645\u0644 \u0643\u062b\u064a\u0641 \u0648\u0623\u062f\u0648\u0627\u062a \u0648\u0627\u0636\u062d\u0629 \u0648\u0645\u0639\u0627\u064a\u0646\u0629 \u062a\u0628\u0642\u0649 \u0645\u0631\u0626\u064a\u0629 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062a\u062d\u0631\u064a\u0631.",
    write: "\u0627\u0644\u0643\u062a\u0627\u0628\u0629",
    templates: "\u0627\u0644\u0642\u0648\u0627\u0644\u0628",
    export: "\u0627\u0644\u062a\u0635\u062f\u064a\u0631",
    search: "\u0627\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0645\u0633\u0648\u062f\u0627\u062a",
    action: "\u0637\u0628\u0642 \u0627\u0644\u0627\u0642\u062a\u0631\u0627\u062d",
    composer: "\u0627\u0637\u0644\u0628 \u0645\u0646 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u062a\u0642\u0648\u064a\u0629 \u0627\u0644\u0645\u0644\u062e\u0635 \u0623\u0648 \u0625\u0636\u0627\u0641\u0629 \u0623\u0631\u0642\u0627\u0645 \u0623\u0648 \u062a\u0631\u062c\u0645\u0629 \u0642\u0633\u0645.",
    preview: "\u0627\u0644\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u062d\u064a\u0629",
    draftLanguage: "\u0644\u063a\u0629 \u0627\u0644\u0645\u0633\u0648\u062f\u0629",
    format: "\u0627\u0644\u0635\u064a\u063a\u0629",
    selected: "\u0627\u0644\u0645\u062d\u062f\u062f",
    insight: "\u0627\u0644\u062a\u0631\u0643\u064a\u0632 \u0627\u0644\u062d\u0627\u0644\u064a",
    insightBody: "\u0627\u0644\u0645\u0644\u062e\u0635 \u064a\u062d\u062a\u0627\u062c \u0646\u062a\u0627\u0626\u062c \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0642\u064a\u0627\u0633.",
    saved: "\u062a\u0645 \u062d\u0641\u0638 \u062d\u0627\u0644\u0629 \u0627\u0644\u0646\u0645\u0648\u0630\u062c \u0645\u062d\u0644\u064a\u0627",
  },
} satisfies Record<AppLocale, Record<string, string>>;

export default function DesignOnePage() {
  const { locale, setLocale, dir } = useAppLocale();
  const copy = getCopy(locale);
  const ui = localCopy[locale];
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("write");
  const [draftLanguage, setDraftLanguage] = useState<AppLocale>(locale);
  const [templateKey, setTemplateKey] = useState<CvProjectTemplateKey>("ats");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState(ui.saved);

  const cvData = useMemo(() => getDemoCv(draftLanguage), [draftLanguage]);
  const previewLocale = useMemo(() => getGeneratorLocale(draftLanguage), [draftLanguage]);
  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return sampleProjects;
    }

    return sampleProjects.filter((project) =>
      [project.name, project.role, project.status, project.template].join(" ").toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const tabs = [
    { id: "write" as const, label: ui.write, icon: Bot },
    { id: "templates" as const, label: ui.templates, icon: LayoutTemplate },
    { id: "export" as const, label: ui.export, icon: Download },
  ];

  return (
    <main id="main" className="cmp-d1" dir={dir}>
      <style>{designOneCss}</style>

      <aside className="cmp-d1-sidebar" aria-label={ui.shell}>
        <div className="cmp-d1-brand">
          <span>{copy.common.brandMark}</span>
          <div>
            <strong>{copy.common.brandTitle}</strong>
            <small>{ui.shell}</small>
          </div>
        </div>

        <nav className="cmp-d1-nav" aria-label={copy.dashboard.headingLabel}>
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "cmp-d1-nav-item cmp-d1-nav-item-active" : "cmp-d1-nav-item"}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="cmp-d1-sidebar-card">
          <Sparkles size={18} />
          <strong>{ui.insight}</strong>
          <p>{ui.insightBody}</p>
        </div>
      </aside>

      <section className="cmp-d1-workspace">
        <header className="cmp-d1-topbar">
          <div>
            <p className="cmp-d1-kicker">{ui.overview}</p>
            <h1>{ui.hero}</h1>
            <p>{ui.body}</p>
          </div>

          <div className="cmp-d1-toolbar" aria-label={copy.common.languageToggleLabel}>
            <button type="button" className={locale === "en" ? "cmp-d1-pill-active" : ""} onClick={() => setLocale("en")}>
              EN
            </button>
            <button type="button" className={locale === "ar" ? "cmp-d1-pill-active" : ""} onClick={() => setLocale("ar")}>
              AR
            </button>
          </div>
        </header>

        <div className="cmp-d1-grid">
          <section className="cmp-d1-panel cmp-d1-command-panel">
            <div className="cmp-d1-search">
              <Search size={17} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={ui.search}
                aria-label={ui.search}
              />
            </div>

            <div className="cmp-d1-project-list">
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={templateKey === project.template ? "cmp-d1-project cmp-d1-project-active" : "cmp-d1-project"}
                  onClick={() => {
                    setTemplateKey(project.template);
                    setNotice(`${ui.selected}: ${project.name}`);
                  }}
                >
                  <FileText size={18} />
                  <span>
                    <strong>{project.name}</strong>
                    <small>{project.role}</small>
                  </span>
                  <em>{project.status}</em>
                </button>
              ))}
            </div>

            <div className="cmp-d1-controls">
              <div>
                <label>{ui.draftLanguage}</label>
                <div className="cmp-d1-segment">
                  <button
                    type="button"
                    className={draftLanguage === "en" ? "cmp-d1-pill-active" : ""}
                    onClick={() => setDraftLanguage("en")}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={draftLanguage === "ar" ? "cmp-d1-pill-active" : ""}
                    onClick={() => setDraftLanguage("ar")}
                  >
                    العربية
                  </button>
                </div>
              </div>

              <div>
                <label>{copy.chat.status.template}</label>
                <div className="cmp-d1-template-row">
                  {(["ats", "harvard", "ada"] as const).map((template) => (
                    <button
                      key={template}
                      type="button"
                      className={templateKey === template ? "cmp-d1-template-active" : ""}
                      onClick={() => setTemplateKey(template)}
                    >
                      <LayoutGrid size={15} />
                      {copy.dashboard.templateNames[template]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeTab === "write" ? (
              <div className="cmp-d1-composer">
                <textarea defaultValue={ui.composer} aria-label={copy.chat.composerPlaceholder} />
                <button
                  type="button"
                  onClick={() => setNotice(`${copy.chat.previewUpdated} ${new Date().toLocaleTimeString(locale)}`)}
                >
                  <Send size={16} />
                  {ui.action}
                </button>
              </div>
            ) : null}

            {activeTab === "templates" ? (
              <div className="cmp-d1-stack">
                {copy.templates.cards.map((card, index) => (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => setTemplateKey((["ats", "harvard", "ada"] as const)[index])}
                  >
                    <strong>{card.title}</strong>
                    <span>{card.body}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {activeTab === "export" ? (
              <div className="cmp-d1-export-box">
                <label>{ui.format}</label>
                <div className="cmp-d1-segment">
                  {(["pdf", "docx"] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      className={exportFormat === format ? "cmp-d1-pill-active" : ""}
                      onClick={() => setExportFormat(format)}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setNotice(`${copy.common.loadingExport} ${exportFormat.toUpperCase()}`)}>
                  <Download size={16} />
                  {copy.chat.exportConfirm}
                </button>
              </div>
            ) : null}
          </section>

          <section className="cmp-d1-panel cmp-d1-preview-panel">
            <div className="cmp-d1-preview-head">
              <div>
                <p className="cmp-d1-kicker">{ui.preview}</p>
                <h2>{cvData.personal.fullName}</h2>
                <span>{cvData.personal.jobTitle}</span>
              </div>
              <div className="cmp-d1-status">
                <Languages size={16} />
                {copy.dashboard.languageNames[draftLanguage]}
              </div>
            </div>

            <div className="cmp-d1-preview-stage">
              <CvPreview data={cvData} previewLocale={previewLocale} templateKey={templateKey} />
            </div>
          </section>
        </div>

        <footer className="cmp-d1-footer" aria-live="polite">
          <span>
            <CheckCircle2 size={16} />
            {notice}
          </span>
          <span>
            <Settings2 size={16} />
            {ui.subtitle}
          </span>
        </footer>
      </section>
    </main>
  );
}

const designOneCss = `
.cmp-d1 {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  background:
    radial-gradient(circle at 22% 16%, oklch(0.38 0.08 178 / 0.26), transparent 28rem),
    linear-gradient(135deg, oklch(0.145 0.015 225), oklch(0.095 0.012 245));
  color: oklch(0.94 0.01 225);
}

.cmp-d1 * {
  box-sizing: border-box;
}

.cmp-d1 button,
.cmp-d1 input,
.cmp-d1 textarea {
  font: inherit;
}

.cmp-d1-sidebar {
  min-height: 100vh;
  padding: 24px;
  border-inline-end: 1px solid oklch(0.36 0.025 225 / 0.7);
  background: oklch(0.13 0.015 230 / 0.86);
  display: flex;
  flex-direction: column;
  gap: 28px;
  position: sticky;
  top: 0;
}

.cmp-d1-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cmp-d1-brand > span {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: oklch(0.73 0.12 176);
  color: oklch(0.12 0.02 230);
  font-weight: 800;
}

.cmp-d1-brand strong,
.cmp-d1-brand small {
  display: block;
}

.cmp-d1-brand small,
.cmp-d1 p,
.cmp-d1 small,
.cmp-d1 label,
.cmp-d1-footer,
.cmp-d1-status,
.cmp-d1-project em {
  color: oklch(0.77 0.016 225);
}

.cmp-d1-nav {
  display: grid;
  gap: 8px;
}

.cmp-d1-nav-item,
.cmp-d1-project,
.cmp-d1-template-row button,
.cmp-d1-stack button,
.cmp-d1-toolbar button,
.cmp-d1-segment button,
.cmp-d1-composer button,
.cmp-d1-export-box > button {
  border: 1px solid oklch(0.35 0.025 225 / 0.8);
  background: oklch(0.19 0.018 230 / 0.78);
  color: oklch(0.93 0.01 225);
  border-radius: 8px;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.cmp-d1-nav-item:hover,
.cmp-d1-project:hover,
.cmp-d1-template-row button:hover,
.cmp-d1-stack button:hover,
.cmp-d1-toolbar button:hover,
.cmp-d1-segment button:hover,
.cmp-d1-composer button:hover,
.cmp-d1-export-box > button:hover {
  transform: translateY(-1px);
  border-color: oklch(0.69 0.1 176);
}

.cmp-d1-nav-item {
  min-height: 44px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: start;
}

.cmp-d1-nav-item-active,
.cmp-d1-pill-active,
.cmp-d1-project-active,
.cmp-d1-template-active {
  background: oklch(0.27 0.07 178 / 0.86) !important;
  border-color: oklch(0.74 0.13 176) !important;
}

.cmp-d1-sidebar-card,
.cmp-d1-panel {
  border: 1px solid oklch(0.34 0.022 225 / 0.76);
  background: oklch(0.16 0.018 230 / 0.82);
  border-radius: 8px;
  box-shadow: 0 24px 90px oklch(0.04 0.01 245 / 0.46);
}

.cmp-d1-sidebar-card {
  margin-top: auto;
  padding: 16px;
}

.cmp-d1-sidebar-card p {
  margin: 8px 0 0;
  line-height: 1.55;
}

.cmp-d1-workspace {
  padding: 28px;
  display: grid;
  gap: 22px;
}

.cmp-d1-topbar,
.cmp-d1-preview-head,
.cmp-d1-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.cmp-d1-topbar h1 {
  max-width: 780px;
  margin: 4px 0 10px;
  font-size: clamp(2rem, 4vw, 4.25rem);
  line-height: 0.96;
  letter-spacing: 0;
}

.cmp-d1-topbar p {
  max-width: 68ch;
  line-height: 1.65;
}

.cmp-d1-kicker {
  margin: 0;
  color: oklch(0.76 0.12 176) !important;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cmp-d1-toolbar,
.cmp-d1-segment {
  display: inline-flex;
  gap: 6px;
  padding: 5px;
  border: 1px solid oklch(0.34 0.022 225 / 0.76);
  border-radius: 8px;
  background: oklch(0.12 0.016 230 / 0.76);
}

.cmp-d1-toolbar button,
.cmp-d1-segment button {
  min-height: 34px;
  padding: 0 12px;
}

.cmp-d1-grid {
  display: grid;
  grid-template-columns: minmax(360px, 0.85fr) minmax(440px, 1.15fr);
  gap: 18px;
  align-items: start;
}

.cmp-d1-panel {
  padding: 18px;
}

.cmp-d1-command-panel {
  display: grid;
  gap: 16px;
}

.cmp-d1-search {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 12px;
  border: 1px solid oklch(0.34 0.022 225 / 0.76);
  border-radius: 8px;
  background: oklch(0.105 0.012 230 / 0.9);
}

.cmp-d1-search input,
.cmp-d1-composer textarea {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: oklch(0.94 0.01 225);
}

.cmp-d1-project-list,
.cmp-d1-controls,
.cmp-d1-stack,
.cmp-d1-export-box {
  display: grid;
  gap: 10px;
}

.cmp-d1-project {
  width: 100%;
  min-height: 66px;
  padding: 12px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  text-align: start;
}

.cmp-d1-project strong,
.cmp-d1-project small {
  display: block;
}

.cmp-d1-project em {
  font-style: normal;
  font-size: 0.78rem;
}

.cmp-d1-template-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.cmp-d1-template-row button {
  min-height: 54px;
  padding: 8px;
  display: grid;
  place-items: center;
  gap: 5px;
  font-size: 0.78rem;
}

.cmp-d1-composer {
  display: grid;
  gap: 10px;
}

.cmp-d1-composer textarea {
  min-height: 104px;
  resize: vertical;
  padding: 12px;
  border: 1px solid oklch(0.34 0.022 225 / 0.76);
  border-radius: 8px;
  background: oklch(0.105 0.012 230 / 0.9);
  line-height: 1.55;
}

.cmp-d1-composer button,
.cmp-d1-export-box > button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: oklch(0.73 0.12 176);
  color: oklch(0.12 0.02 230);
  font-weight: 800;
}

.cmp-d1-stack button {
  padding: 12px;
  display: grid;
  gap: 6px;
  text-align: start;
}

.cmp-d1-stack span {
  color: oklch(0.77 0.016 225);
  line-height: 1.45;
}

.cmp-d1-preview-panel {
  min-width: 0;
}

.cmp-d1-preview-head h2 {
  margin: 3px 0;
  font-size: 1.4rem;
}

.cmp-d1-status,
.cmp-d1-footer span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.cmp-d1-preview-stage {
  margin-top: 16px;
  max-height: 68vh;
  overflow: auto;
  padding: 16px;
  border-radius: 8px;
  background: oklch(0.105 0.012 230 / 0.9);
}

.cmp-d1-preview-stage .preview-paper {
  margin: 0 auto;
  transform-origin: top center;
}

.cmp-d1-footer {
  padding-block: 4px 10px;
  font-size: 0.88rem;
}

@media (max-width: 1120px) {
  .cmp-d1 {
    grid-template-columns: 1fr;
  }

  .cmp-d1-sidebar {
    min-height: auto;
    position: static;
  }

  .cmp-d1-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .cmp-d1-workspace,
  .cmp-d1-sidebar {
    padding: 16px;
  }

  .cmp-d1-topbar,
  .cmp-d1-preview-head,
  .cmp-d1-footer {
    flex-direction: column;
  }

  .cmp-d1-template-row {
    grid-template-columns: 1fr;
  }

  .cmp-d1-preview-stage {
    padding: 10px;
  }
}
`;
