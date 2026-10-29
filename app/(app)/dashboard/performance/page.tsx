"use client";

import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import HoverActionButton from "@/components/ui/HoverActionButton";
import { getCopy } from "@/lib/app/content";

export default function PerformancePage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <div className="library-page">
      <section className="library-hero">
        <div className="library-hero-copy">
          <p className="workspace-label">{copy.performance.headingLabel}</p>
          <h1 className="workspace-title">{copy.performance.headingTitle}</h1>
          <p className="muted-copy workspace-heading-copy">{copy.performance.headingBody}</p>
        </div>
        <HoverActionButton href="/chat/new">{copy.performance.primaryAction}</HoverActionButton>
      </section>

      <p className="readiness-note">{copy.performance.readinessNote}</p>

      <section className="library-utility-grid">
        {copy.performance.columns.map((column) => (
          <article key={column.title} className="library-utility-card">
            <p className="workspace-label">{column.eyebrow}</p>
            <h2>{column.title}</h2>
            <div className="prose-stack">
              {column.items.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
