"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import LocaleToggle from "@/components/ui/LocaleToggle";
import StudioHeader from "@/components/ui/StudioHeader";
import { getCopy } from "@/lib/app/content";

export default function SettingsPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const user = useQuery(api.users.current);
  const sessionValue = user === undefined ? "…" : user?.email || copy.dashboard.accountLabel;

  return (
    <div className="library-page">
      <StudioHeader
        label={copy.settings.headingLabel}
        title={copy.settings.headingTitle}
        body={copy.settings.headingBody}
        meta={[
          { label: copy.settings.localeEyebrow, value: copy.meta.languageName },
          { label: copy.settings.accountEyebrow, value: sessionValue },
          { label: copy.settings.exportEyebrow, value: copy.dashboard.meta.exportValue },
        ]}
      />

      <section className="settings-board" aria-label={copy.settings.headingTitle}>
        <div className="settings-field">
          <div className="settings-field__copy">
            <p className="workspace-label">{copy.settings.localeEyebrow}</p>
            <h2>{copy.settings.localeTitle}</h2>
            <p className="muted-copy">{copy.settings.localeBody}</p>
          </div>
          <div className="settings-field__control">
            <LocaleToggle compact />
          </div>
        </div>

        <div className="density-separator" role="separator" />

        <div className="settings-field">
          <div className="settings-field__copy">
            <p className="workspace-label">{copy.settings.accountEyebrow}</p>
            <h2>{copy.settings.accountTitle}</h2>
            <p className="muted-copy">{copy.settings.accountBody}</p>
          </div>
          <div className="settings-field__control">
            <p className="settings-account-value">
              <span>{copy.settings.sessionEmailLabel}</span>
              <strong>{sessionValue}</strong>
            </p>
            <div className="settings-field__actions">
              <Link href="/dashboard" className="button-secondary">
                {copy.common.backToDashboard}
              </Link>
              <Link href="/chat/new" className="button-secondary">
                {copy.common.openWorkspace}
              </Link>
            </div>
          </div>
        </div>

        <div className="density-separator" role="separator" />

        <div className="settings-field settings-field--stack">
          <div className="settings-field__copy">
            <p className="workspace-label">{copy.settings.exportEyebrow}</p>
            <h2>{copy.settings.exportTitle}</h2>
            <p className="muted-copy">{copy.settings.exportBody}</p>
          </div>
          <ul className="density-rows">
            {copy.settings.exportNotes.map((note, index) => (
              <li key={note}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
