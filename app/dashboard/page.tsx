"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { CalendarClock, Clock3, FileDown, Languages, MapPin, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import CvCardPreview from "@/components/cv/CvCardPreview";
import HoverActionButton from "@/components/ui/HoverActionButton";
import TextShimmer from "@/components/ui/TextShimmer";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";
import { downloadCv } from "@/lib/cv/downloadClient";
import {
  buildWorkspaceHref,
  convexRowToProject,
  type DemoCvProject,
} from "@/lib/cv/projects";

type ExportFormat = "pdf" | "docx";
type DashboardNotice = "loadingExport" | "exportReady" | "exportFailed";

const summaryIcons = [FileSummaryIcon, Languages, ShieldCheck];

function FileSummaryIcon() {
  return <Clock3 size={16} />;
}

export default function DashboardPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const user = useQuery(api.users.current);
  const rawProjects = useQuery(api.projects.listUserProjects);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  const libraryProjects = useMemo(() => {
    if (!rawProjects) return [];
    return rawProjects.map(convexRowToProject);
  }, [rawProjects]);

  const [query, setQuery] = useState("");
  const [activeExport, setActiveExport] = useState<string | null>(null);
  const [notice, setNotice] = useState<DashboardNotice | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    const searchValue = query.trim().toLowerCase();

    if (!searchValue) {
      return libraryProjects;
    }

    return libraryProjects.filter((project) => {
      const variant = project.variant;
      const haystack = [
        variant.personal.fullName,
        variant.personal.jobTitle,
        variant.summary,
        getProjectLanguageSummary(copy),
        copy.dashboard.templateNames[project.shared.templateKey],
        copy.dashboard.status[project.shared.statusKey],
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchValue);
    });
  }, [copy, libraryProjects, query]);

  const summaryCards = useMemo(
    () => [
      { value: String(libraryProjects.length), label: copy.dashboard.summary.totalDrafts },
      { value: "EN + AR", label: copy.dashboard.summary.bilingual },
      { value: copy.dashboard.summary.exportReadyValue, label: copy.dashboard.summary.exportReady },
    ],
    [copy, libraryProjects.length],
  );

  const noticeCopy = notice === null ? null : copy.common[notice];
  const isLoading = rawProjects === undefined;

  const handleExport = async (project: DemoCvProject, format: ExportFormat) => {
    const exportKey = `${project.id}-${format}`;

    try {
      setActiveExport(exportKey);
      setNotice("loadingExport");
      await downloadCv(project.variant, format, project.shared.templateKey);
      setNotice("exportReady");
    } catch {
      setNotice("exportFailed");
    } finally {
      setActiveExport(null);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm(copy.dashboard.deleteConfirm ?? "Delete this project?")) return;

    try {
      setDeletingId(projectId);
      await deleteProjectMutation({ projectId: projectId as Id<"cvProjects"> });
    } catch {
      // silently fail — Convex will revert optimistic state
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="library-page">
      <section className="library-hero motion-slide-up">
        <div className="library-hero-copy">
          <p className="workspace-label">{copy.dashboard.headingLabel}</p>
          <h1 className="workspace-title">{copy.dashboard.headingTitle}</h1>
          <p className="muted-copy workspace-heading-copy">
            {copy.dashboard.headingBodyStart} <strong>{user?.email ?? copy.dashboard.accountLabel}</strong>. {copy.dashboard.headingBodyEnd}
          </p>
        </div>

        <div className="library-hero-actions">
          <HoverActionButton href="/dashboard/templates">
            <Plus size={16} />
            {copy.dashboard.createNew ?? "Create new CV"}
          </HoverActionButton>
        </div>
      </section>

      {noticeCopy ? (
        <div className="inline-notice library-inline-notice motion-slide-up motion-delay-1">
          {activeExport ? <TextShimmer>{noticeCopy}</TextShimmer> : noticeCopy}
        </div>
      ) : null}

      <section className="library-summary-grid">
        {summaryCards.map((item, index) => {
          const Icon = summaryIcons[index];

          return (
            <article key={item.label} className={`library-summary-card motion-slide-up motion-delay-${Math.min(index + 1, 3)}`}>
              <span className="library-summary-icon">
                <Icon />
              </span>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          );
        })}
      </section>

      <section className="library-section motion-slide-up motion-delay-2">
        <div className="library-section-head">
          <div className="library-section-head-copy">
            <h2>{copy.dashboard.libraryTitle}</h2>
            <p>{copy.dashboard.libraryBody}</p>
          </div>

          <div className="library-section-controls">
            <label className="library-search-shell" htmlFor="library-search">
              <Search size={16} />
              <input
                id="library-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.common.searchPlaceholder}
                aria-label={copy.common.searchPlaceholder}
              />
            </label>
            <span className="pill">{filteredProjects.length}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="library-empty-state">
            <TextShimmer>{copy.common.loadingWorkspace ?? "Loading projects…"}</TextShimmer>
          </div>
        ) : filteredProjects.length === 0 && query.trim() ? (
          <article className="library-empty-state">
            <p>{copy.dashboard.emptySearch}</p>
          </article>
        ) : filteredProjects.length === 0 ? (
          <article className="library-empty-state library-empty-state--cta">
            <p>{copy.dashboard.emptyLibrary ?? "You haven't created any CVs yet."}</p>
            <HoverActionButton href="/dashboard/templates">
              <Plus size={16} />
              {copy.dashboard.createNew ?? "Create your first CV"}
            </HoverActionButton>
          </article>
        ) : (
          <div className="library-card-grid">
            {filteredProjects.map((project, index) => {
              const displayLanguage = project.variant.language;
              const displayVariant = project.variant;

              return (
                <article key={project.id} className={`library-card motion-slide-up motion-delay-${Math.min(index + 1, 4)}`}>
                  <CvCardPreview
                    data={displayVariant}
                    templateKey={project.shared.templateKey}
                    className="library-template-stage"
                  />

                  <div className="library-card-top">
                    <div className="library-card-pills">
                      <span className="pill">{copy.dashboard.templateNames[project.shared.templateKey]}</span>
                      <span className={`library-status-badge library-status-badge--${project.shared.statusKey}`}>
                        {copy.dashboard.status[project.shared.statusKey]}
                      </span>
                    </div>
                  </div>

                  <div className="library-card-copy">
                    <h3>{displayVariant.personal.fullName || (copy.dashboard.untitledProject ?? "Untitled CV")}</h3>
                    <p className="library-card-role">{displayVariant.personal.jobTitle}</p>
                  </div>

                  <div className="library-card-meta-pills">
                    {displayVariant.personal.location ? (
                      <span className="library-meta-pill">
                        <MapPin size={14} />
                        {displayVariant.personal.location}
                      </span>
                    ) : null}
                    <span className="library-meta-pill">
                      <CalendarClock size={14} />
                      {copy.dashboard.updated[project.shared.updatedKey]}
                    </span>
                  </div>

                  <div className="library-card-actions">
                    <HoverActionButton
                      href={buildWorkspaceHref({ language: displayLanguage, projectId: project.id })}
                      className="library-card-primary"
                    >
                      {copy.dashboard.cardPrimaryAction}
                    </HoverActionButton>

                    <button
                      type="button"
                      className="button-small library-card-export-compact"
                      onClick={() => void handleExport(project, "pdf")}
                      disabled={activeExport === `${project.id}-pdf`}
                    >
                      <FileDown size={14} />
                      {activeExport === `${project.id}-pdf` ? copy.common.loadingExport : copy.common.exportPdf}
                    </button>

                    <button
                      type="button"
                      className="button-small library-card-delete"
                      onClick={() => void handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      title={copy.dashboard.deleteProject ?? "Delete project"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function getProjectLanguageSummary(copy: ReturnType<typeof getCopy>) {
  return `${copy.dashboard.languageNames.en} + ${copy.dashboard.languageNames.ar}`;
}
