"use client";

import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import HoverActionButton from "@/components/ui/HoverActionButton";
import StudioHeader from "@/components/ui/StudioHeader";
import { getCopy } from "@/lib/app/content";

export default function PerformancePage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <div className="library-page">
      <StudioHeader
        label={copy.performance.headingLabel}
        title={copy.performance.headingTitle}
        body={copy.performance.headingBody}
        action={<HoverActionButton href="/chat/new">{copy.performance.primaryAction}</HoverActionButton>}
        meta={copy.performance.stats.map((stat) => ({ label: stat.label, value: stat.value }))}
      />

      <p className="readiness-note">{copy.performance.readinessNote}</p>

      <section className="readiness-board">
        {copy.performance.columns.map((column) => (
          <article key={column.title}>
            <header className="readiness-column-head">
              <p className="workspace-label">{column.eyebrow}</p>
              <h2>{column.title}</h2>
            </header>
            <ul className="density-rows">
              {column.items.map((item, index) => (
                <li key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
