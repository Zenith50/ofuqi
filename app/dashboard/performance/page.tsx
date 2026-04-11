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

      <section className="library-summary-grid motion-slide-up motion-delay-1">
        {copy.performance.stats.map((stat, index) => (
          <article key={stat.label} className={`library-summary-card motion-slide-up motion-delay-${Math.min(index + 1, 3)}`}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="library-utility-grid motion-slide-up motion-delay-2">
        {copy.performance.columns.map((column) => (
          <article key={column.title} className="library-utility-card library-utility-card--stacked">
            <div>
              <p className="workspace-label">{column.eyebrow}</p>
              <h3>{column.title}</h3>
            </div>

            <div className="panel-stack">
              {column.items.map((item) => (
                <div key={item} className="library-check-item">
                  <span className="library-check-dot" aria-hidden="true" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
