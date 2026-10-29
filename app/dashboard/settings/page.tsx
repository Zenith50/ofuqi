"use client";

import Link from "next/link";
import LocaleToggle from "@/components/ui/LocaleToggle";
import HoverActionButton from "@/components/ui/HoverActionButton";
import Reveal, { RevealItem } from "@/components/ui/Reveal";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";

export default function SettingsPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <div className="library-page">
      <Reveal className="library-hero">
        <div className="library-hero-copy">
          <p className="workspace-label">{copy.settings.headingLabel}</p>
          <h1 className="workspace-title">{copy.settings.headingTitle}</h1>
          <p className="muted-copy workspace-heading-copy">{copy.settings.headingBody}</p>
        </div>

        <HoverActionButton href="/chat/new">{copy.settings.primaryAction}</HoverActionButton>
      </Reveal>

      <Reveal className="library-utility-grid" stagger>
        <RevealItem>
        <article className="library-utility-card library-utility-card--stacked">
          <div>
            <p className="workspace-label">{copy.settings.localeEyebrow}</p>
            <h3>{copy.settings.localeTitle}</h3>
            <p className="muted-copy">{copy.settings.localeBody}</p>
          </div>

          <div className="settings-language-row">
            <span className="pill">{copy.meta.languageName}</span>
            <LocaleToggle label={copy.common.languageToggleLabel} />
          </div>
        </article>
        </RevealItem>

        <RevealItem>
        <article className="library-utility-card library-utility-card--stacked">
          <div>
            <p className="workspace-label">{copy.settings.exportEyebrow}</p>
            <h3>{copy.settings.exportTitle}</h3>
            <p className="muted-copy">{copy.settings.exportBody}</p>
          </div>

          <div className="panel-stack">
            {copy.settings.exportNotes.map((note) => (
              <div key={note} className="library-check-item">
                <span className="library-check-dot" aria-hidden="true" />
                <p>{note}</p>
              </div>
            ))}
          </div>
        </article>
        </RevealItem>

        <RevealItem>
        <article className="library-utility-card library-utility-card--stacked">
          <div>
            <p className="workspace-label">{copy.settings.accountEyebrow}</p>
            <h3>{copy.settings.accountTitle}</h3>
            <p className="muted-copy">{copy.settings.accountBody}</p>
          </div>

          <div className="button-row button-row--compact">
            <Link href="/dashboard" className="button-small">
              {copy.common.backToDashboard}
            </Link>
            <Link href="/chat/new" className="button-small">
              {copy.common.openWorkspace}
            </Link>
          </div>
        </article>
        </RevealItem>
      </Reveal>
    </div>
  );
}
