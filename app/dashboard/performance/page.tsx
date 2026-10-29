"use client";

import HoverActionButton from "@/components/ui/HoverActionButton";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";

export default function PerformancePage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <div className="library-page">
      <section className="library-hero motion-slide-up">
        <div className="library-hero-copy">
          <p className="workspace-label">{copy.performance.headingLabel}</p>
          <h1 className="workspace-title">{copy.performance.headingTitle}</h1>
          <p className="muted-copy workspace-heading-copy">{copy.performance.headingBody}</p>
        </div>

        <HoverActionButton href="/chat/new">{copy.performance.primaryAction}</HoverActionButton>
      </section>

      <section
        className="library-section motion-slide-up motion-delay-1"
        aria-label={copy.performance.headingLabel}
      >
        <div className="panel-stack">
          {copy.performance.stats.map((stat) => (
            <div key={stat.label} className="library-check-item">
              <span className="library-check-dot" aria-hidden="true" />
              <div className="library-card-copy">
                <p className="library-card-role">{stat.label}</p>
                <p className="library-card-summary">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {copy.performance.columns.map((column, index) => (
        <section
          key={column.title}
          className={`library-section motion-slide-up motion-delay-${Math.min(index + 2, 4)}`}
        >
          <div className="library-section-head">
            <div className="library-section-head-copy">
              <p className="workspace-label">{column.eyebrow}</p>
              <h2>{column.title}</h2>
            </div>
          </div>

          <div className="panel-stack">
            {column.items.map((item) => (
              <div key={item} className="library-check-item">
                <span className="library-check-dot" aria-hidden="true" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
