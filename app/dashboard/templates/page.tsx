"use client";

import HoverActionButton from "@/components/ui/HoverActionButton";
import CvCardPreview from "@/components/cv/CvCardPreview";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";
import { buildWorkspaceHref, createStarterCvProject } from "@/lib/cv/projects";
import { CV_TEMPLATE_KEYS } from "@/lib/cv/templates";

export default function TemplatesPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <div className="library-page">
      <section className="library-hero motion-slide-up">
        <div className="library-hero-copy">
          <p className="workspace-label">{copy.templates.headingLabel}</p>
          <h1 className="workspace-title">{copy.templates.headingTitle}</h1>
          <p className="muted-copy workspace-heading-copy">{copy.templates.headingBody}</p>
        </div>

        <HoverActionButton href="/chat/new">{copy.templates.primary}</HoverActionButton>
      </section>

      <section className="library-card-grid motion-slide-up motion-delay-1">
        {copy.templates.cards.map((card, index) => {
          const templateKey = CV_TEMPLATE_KEYS[index] ?? "ats";
          const starterProject = createStarterCvProject(templateKey);
          const previewVariant = starterProject.variant;

          return (
            <article key={card.title} className="library-card library-card--template">
              <CvCardPreview
                data={previewVariant}
                templateKey={templateKey}
                className={`library-template-stage motion-float motion-delay-${Math.min(index + 1, 3)}`}
              />

              <div className="library-card-copy">
                <div className="library-card-top">
                  <div className="library-card-pills">
                    <span className="pill">{card.tag}</span>
                  </div>
                  <span className="library-language-badge">{card.support}</span>
                </div>

                <h3>{card.title}</h3>
                <p className="library-card-role">{card.roles}</p>
                <p className="library-card-summary">{card.body}</p>
              </div>

              <div className="library-card-actions">
                <HoverActionButton
                  href={buildWorkspaceHref({ templateKey })}
                  className="library-card-primary"
                >
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
