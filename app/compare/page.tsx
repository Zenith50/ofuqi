"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Monitor, PanelsTopLeft } from "lucide-react";

import LocaleToggle from "@/components/ui/LocaleToggle";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";

type ComparisonVersion = {
  id: "main" | "design-1" | "design-2";
  label: string;
  href: string;
  summary: string;
};

const versions: ComparisonVersion[] = [
  {
    id: "main",
    label: "main",
    href: "/",
    summary: "Current app, untouched production landing route.",
  },
  {
    id: "design-1",
    label: "design-1",
    href: "/design-1",
    summary: "Dense command workspace with library, writing, and preview in one surface.",
  },
  {
    id: "design-2",
    label: "design-2",
    href: "/design-2",
    summary: "Guided review studio focused on steps, evidence, and bilingual confidence.",
  },
];

export default function ComparePage() {
  const [activeId, setActiveId] = useState<ComparisonVersion["id"]>("main");
  const { dir } = useAppLocale();

  const activeVersion = useMemo(
    () => versions.find((version) => version.id === activeId) ?? versions[0],
    [activeId],
  );

  return (
    <main className="cmp-shell" dir={dir}>
      <header className="cmp-topbar">
        <div className="cmp-brand">
          <span className="cmp-mark">OF</span>
          <div>
            <p>Ofuqi UI comparison</p>
            <h1>main / design-1 / design-2</h1>
          </div>
        </div>

        <div className="cmp-actions">
          <LocaleToggle compact />
          <Link href={activeVersion.href} className="button-secondary" target="_blank">
            <ExternalLink size={15} />
            Open active
          </Link>
        </div>
      </header>

      <section className="cmp-switcher" aria-label="Design versions">
        {versions.map((version) => (
          <button
            key={version.id}
            type="button"
            className={version.id === activeId ? "active" : undefined}
            onClick={() => setActiveId(version.id)}
            aria-pressed={version.id === activeId}
          >
            <PanelsTopLeft size={16} />
            <span>{version.label}</span>
          </button>
        ))}
      </section>

      <section className="cmp-stage">
        <aside className="cmp-notes">
          <div className="cmp-note-head">
            <Monitor size={18} />
            <span>{activeVersion.label}</span>
          </div>
          <p>{activeVersion.summary}</p>
          <p>
            Use the selector above to switch versions. The original app is loaded through the
            existing root route and has not been overwritten.
          </p>
        </aside>

        <iframe
          key={activeVersion.id}
          className="cmp-frame"
          src={activeVersion.href}
          title={`${activeVersion.label} comparison preview`}
        />
      </section>
    </main>
  );
}
