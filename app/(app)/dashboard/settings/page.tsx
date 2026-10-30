"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import LocaleToggle from "@/components/ui/LocaleToggle";
import { getCopy } from "@/lib/app/content";

export default function SettingsPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const user = useQuery(api.users.current);

  return (
    <div className="library-page">
      <section className="library-hero">
        <div className="library-hero-copy">
          <p className="workspace-label">{copy.settings.headingLabel}</p>
          <h1 className="workspace-title">{copy.settings.headingTitle}</h1>
          <p className="muted-copy workspace-heading-copy">{copy.settings.headingBody}</p>
        </div>
      </section>

      <section className="settings-layout">
        <article className="library-utility-card">
          <p className="workspace-label">{copy.settings.localeEyebrow}</p>
          <h2>{copy.settings.localeTitle}</h2>
          <p className="muted-copy">{copy.settings.localeBody}</p>
          <LocaleToggle label={copy.common.languageToggleLabel} />
        </article>

        <article className="library-utility-card">
          <p className="workspace-label">{copy.settings.accountEyebrow}</p>
          <h2>{copy.settings.accountTitle}</h2>
          <p className="muted-copy">{copy.settings.accountBody}</p>
          <p className="settings-account">
            <span>{copy.settings.sessionEmailLabel}</span>
            <strong>{user?.email ?? copy.dashboard.accountLabel}</strong>
          </p>
          <div className="button-row">
            <Link href="/dashboard" className="button-secondary">
              {copy.common.backToDashboard}
            </Link>
            <Link href="/chat/new" className="button-secondary">
              {copy.common.openWorkspace}
            </Link>
          </div>
        </article>

        <article className="library-utility-card">
          <p className="workspace-label">{copy.settings.exportEyebrow}</p>
          <h2>{copy.settings.exportTitle}</h2>
          <div className="prose-stack">
            <p>{copy.settings.exportBody}</p>
            {copy.settings.exportNotes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
