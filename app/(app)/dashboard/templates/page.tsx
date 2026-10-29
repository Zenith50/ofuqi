"use client";

import SheetFrame from "@/components/cv/SheetFrame";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import HoverActionButton from "@/components/ui/HoverActionButton";
import { getCopy } from "@/lib/app/content";
import { buildWorkspaceHref } from "@/lib/cv/projects";
import { CV_TEMPLATE_KEYS } from "@/lib/cv/templates";

export default function TemplatesPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <div className="library-page">
      <section className="library-hero">
        <div className="library-hero-copy">
          <p className="workspace-label">{copy.templates.headingLabel}</p>
          <h1 className="workspace-title">{copy.templates.headingTitle}</h1>
          <p className="muted-copy workspace-heading-copy">{copy.templates.headingBody}</p>
        </div>
        <HoverActionButton href="/chat/new">{copy.dashboard.primaryAction}</HoverActionButton>
      </section>

      <section className="library-card-grid">
        {copy.templates.cards.map((card, index) => {
          const templateKey = CV_TEMPLATE_KEYS[index] ?? "ats";

          return (
            <article key={card.title} className="library-card library-card--template">
              <div className="desk-well">
                <SheetFrame templateKey={templateKey} sampleLocale={locale} />
              </div>
              <div className="library-card-copy">
                <div className="library-card-facts">
                  <span className="meta-badge">{card.tag}</span>
                  <span className="meta-badge">{card.support}</span>
                </div>
                <h2>{card.title}</h2>
                <p className="library-card-role">{card.roles}</p>
                <p className="library-card-summary">{card.body}</p>
              </div>
              <div className="library-card-actions">
                <HoverActionButton href={buildWorkspaceHref({ templateKey })} className="library-card-primary">
                  {copy.templates.primary}
                </HoverActionButton>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
