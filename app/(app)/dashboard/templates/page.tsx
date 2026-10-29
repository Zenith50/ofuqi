"use client";

import SheetFrame from "@/components/cv/SheetFrame";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import HoverActionButton from "@/components/ui/HoverActionButton";
import StudioHeader from "@/components/ui/StudioHeader";
import { getCopy } from "@/lib/app/content";
import { buildWorkspaceHref } from "@/lib/cv/projects";
import { CV_TEMPLATE_KEYS } from "@/lib/cv/templates";

export default function TemplatesPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <div className="library-page">
      <StudioHeader
        label={copy.templates.headingLabel}
        title={copy.templates.headingTitle}
        body={copy.templates.headingBody}
        action={<HoverActionButton href="/chat/new">{copy.dashboard.primaryAction}</HoverActionButton>}
        meta={[
          { label: copy.templates.meta.formats, value: copy.templates.meta.formatsValue },
          { label: copy.templates.meta.languages, value: copy.templates.meta.languagesValue },
          { label: copy.templates.meta.output, value: copy.templates.meta.outputValue },
        ]}
      />

      <section className="library-section">
        <div className="library-card-grid">
          {copy.templates.cards.map((card, index) => {
            const templateKey = CV_TEMPLATE_KEYS[index] ?? "ats";

            return (
              <article key={card.title} className="library-card library-card--template">
                <SheetFrame templateKey={templateKey} sampleLocale={locale} />
                <div className="library-card-copy">
                  <div className="library-card-facts">
                    <span className="meta-badge">{card.tag}</span>
                    <span className="meta-badge">{card.support}</span>
                  </div>
                  <h2>{card.title}</h2>
                  <p className="library-card-role">{card.roles}</p>
                  <p className="library-card-summary">{card.body}</p>
                </div>
                <ul className="library-specs">
                  {card.specs.map((spec) => (
                    <li key={spec} className="meta-badge">{spec}</li>
                  ))}
                </ul>
                <div className="library-card-actions">
                  <HoverActionButton href={buildWorkspaceHref({ templateKey })} className="library-card-primary">
                    {copy.templates.primary}
                  </HoverActionButton>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
