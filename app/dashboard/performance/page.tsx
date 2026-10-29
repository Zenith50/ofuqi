"use client";

import HoverActionButton from "@/components/ui/HoverActionButton";
import Reveal, { RevealItem } from "@/components/ui/Reveal";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";

export default function PerformancePage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <div className="library-page">
      <Reveal className="library-hero">
        <div className="library-hero-copy">
          <p className="workspace-label">{copy.performance.headingLabel}</p>
          <h1 className="workspace-title">{copy.performance.headingTitle}</h1>
          <p className="muted-copy workspace-heading-copy">{copy.performance.headingBody}</p>
        </div>

        <HoverActionButton href="/chat/new">{copy.performance.primaryAction}</HoverActionButton>
      </Reveal>

      <Reveal className="library-summary-grid" stagger>
        {copy.performance.stats.map((stat) => (
          <RevealItem key={stat.label}>
            <article className="library-summary-card">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          </RevealItem>
        ))}
      </Reveal>

      <Reveal className="library-utility-grid" stagger>
        {copy.performance.columns.map((column) => (
          <RevealItem key={column.title}>
          <article className="library-utility-card library-utility-card--stacked">
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
          </RevealItem>
        ))}
      </Reveal>
    </div>
  );
}
