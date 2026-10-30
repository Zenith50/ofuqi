"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileDown, Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import SheetFrame from "@/components/cv/SheetFrame";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import EmptyState from "@/components/ui/EmptyState";
import HoverActionButton from "@/components/ui/HoverActionButton";
import { getCopy } from "@/lib/app/content";
import { downloadCv } from "@/lib/cv/downloadClient";
import { buildWorkspaceHref, convexRowToProject, type DemoCvProject } from "@/lib/cv/projects";

type DashboardNotice = "loadingExport" | "exportReady" | "exportFailed" | "deleteFailed";

export default function DashboardPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const rawProjects = useQuery(api.projects.listUserProjects);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  const libraryProjects = useMemo(() => {
    if (!rawProjects) {
      return [];
    }

    return rawProjects.map(convexRowToProject);
  }, [rawProjects]);

  const [query, setQuery] = useState("");
  const [activeExport, setActiveExport] = useState<string | null>(null);
  const [notice, setNotice] = useState<DashboardNotice | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isLoading = rawProjects === undefined;

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
        copy.dashboard.languageNames[variant.language],
        copy.dashboard.templateNames[project.shared.templateKey],
        copy.dashboard.status[project.shared.statusKey],
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchValue);
    });
  }, [copy, libraryProjects, query]);

  const noticeCopy = notice === "deleteFailed"
    ? copy.dashboard.deleteFailed
    : notice
      ? copy.common[notice]
      : null;
  const noticeRole = notice === "exportFailed" || notice === "deleteFailed" ? "alert" : "status";

  const handleExport = async (project: DemoCvProject) => {
    const exportKey = `${project.id}-pdf`;

    setActiveExport(exportKey);
    setNotice("loadingExport");

    await downloadCv(project.variant, "pdf", project.shared.templateKey)
      .then(() => {
        setNotice("exportReady");
      })
      .catch(() => {
        setNotice("exportFailed");
      });

    setActiveExport(null);
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm(copy.dashboard.deleteConfirm)) {
      return;
    }

    setDeletingId(projectId);
    await deleteProjectMutation({ projectId: projectId as Id<"cvProjects"> })
      .catch(() => {
        setNotice("deleteFailed");
      });
    setDeletingId(null);
  };

  return (
    <div className="library-page">
      <section className="library-hero">
        <div className="library-hero-copy">
          <p className="workspace-label">{copy.dashboard.headingLabel}</p>
          <h1 className="workspace-title">{copy.dashboard.headingTitle}</h1>
          <p className="muted-copy workspace-heading-copy">{copy.dashboard.headingBody}</p>
        </div>
        <HoverActionButton href="/chat/new">
          <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
          {copy.dashboard.primaryAction}
        </HoverActionButton>
      </section>

      {noticeCopy ? (
        <div className={noticeRole === "alert" ? "inline-notice inline-notice--alert" : "inline-notice"} role={noticeRole}>
          <p>{noticeCopy}</p>
          <button type="button" className="button-small" onClick={() => setNotice(null)}>
            {copy.common.dismiss}
          </button>
        </div>
      ) : null}

      <section className="library-section">
        <div className="library-section-head">
          <div className="library-section-head-copy">
            <h2>{copy.dashboard.libraryTitle}</h2>
            <p>{copy.dashboard.libraryBody}</p>
          </div>
          <div className="library-section-controls">
            <label className="library-search-shell" htmlFor="library-search">
              <Search size={16} strokeWidth={1.5} aria-hidden="true" />
              <input
                id="library-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.common.searchPlaceholder}
                aria-label={copy.common.searchPlaceholder}
              />
            </label>
            {isLoading ? null : <span className="count-badge">{filteredProjects.length}</span>}
          </div>
        </div>

        {isLoading ? (
          <div className="library-skeleton" aria-busy="true">
            <p role="status">{copy.dashboard.loadingLibrary}</p>
            <div className="library-skeleton-grid">
              <div className="library-skeleton-card" />
              <div className="library-skeleton-card" />
              <div className="library-skeleton-card" />
            </div>
          </div>
        ) : libraryProjects.length === 0 ? (
          <EmptyState
            title={copy.dashboard.emptyLibraryTitle}
            body={copy.dashboard.emptyLibrary}
            action={(
              <HoverActionButton href="/chat/new">
                <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
                {copy.dashboard.primaryAction}
              </HoverActionButton>
            )}
          />
        ) : (
          <>
            {filteredProjects.length === 0 ? (
              <EmptyState
                icon={<Search size={18} aria-hidden="true" />}
                title={copy.dashboard.emptySearchTitle}
                body={copy.dashboard.emptySearch}
                action={(
                  <button type="button" className="button-secondary" onClick={() => setQuery("")}>
                    {copy.common.clearSearch}
                  </button>
                )}
              />
            ) : null}
            <div className={filteredProjects.length === 0 ? "library-card-grid is-entering is-filtered-out" : "library-card-grid is-entering"}>
            {libraryProjects.map((project) => {
              const matches = filteredProjects.some((item) => item.id === project.id);
              const displayVariant = project.variant;

              return (
                <article key={project.id} className="library-card" hidden={!matches}>
                  <SheetFrame data={displayVariant} templateKey={project.shared.templateKey} />
                  <div className="library-card-facts">
                    <span className="meta-badge">
                      <span className="status-dot status-dot--accent" aria-hidden="true" />
                      {copy.dashboard.languageNames[displayVariant.language]}
                    </span>
                    <span className={`meta-badge meta-badge--${project.shared.statusKey}`}>
                      <span className={`status-dot status-dot--${project.shared.statusKey}`} aria-hidden="true" />
                      {copy.dashboard.status[project.shared.statusKey]}
                    </span>
                    <span className="meta-badge">{copy.dashboard.templateNames[project.shared.templateKey]}</span>
                  </div>
                  <div className="library-card-copy">
                    <h3>{displayVariant.personal.fullName || copy.dashboard.untitledProject}</h3>
                    <p className="library-card-role">{displayVariant.personal.jobTitle}</p>
                  </div>
                  <div className="library-card-actions">
                    <HoverActionButton
                      href={buildWorkspaceHref({ language: displayVariant.language, projectId: project.id })}
                      className="library-card-primary"
                    >
                      {copy.dashboard.cardPrimaryAction}
                    </HoverActionButton>
                    <button
                      type="button"
                      className="button-small"
                      onClick={() => void handleExport(project)}
                      disabled={activeExport === `${project.id}-pdf`}
                    >
                      <FileDown size={16} strokeWidth={1.5} aria-hidden="true" />
                      {activeExport === `${project.id}-pdf` ? copy.common.loadingExport : copy.common.exportPdf}
                    </button>
                    <button
                      type="button"
                      className="button-small button-danger"
                      onClick={() => void handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      aria-label={copy.dashboard.deleteProject}
                    >
                      <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
