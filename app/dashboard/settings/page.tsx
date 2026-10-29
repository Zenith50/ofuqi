"use client";

import Link from "next/link";

import LocaleToggle from "@/components/ui/LocaleToggle";
import HoverActionButton from "@/components/ui/HoverActionButton";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy, type AppLocale } from "@/lib/app/content";

const linkSectionCopy: Record<
  AppLocale,
  {
    title: string;
    body: string;
  }
> = {
  en: {
    title: "Links",
    body: "Open the library or the workspace.",
  },
  ar: {
    title: "روابط",
    body: "افتح المكتبة أو مساحة العمل.",
  },
};

export default function SettingsPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const links = linkSectionCopy[locale];

  return (
    <div className="library-page">
      <section className="library-hero motion-slide-up">
        <div className="library-hero-copy">
          <p className="workspace-label">{copy.settings.headingLabel}</p>
          <h1 className="workspace-title">{copy.settings.localeTitle}</h1>
          <p className="muted-copy workspace-heading-copy">{copy.settings.localeBody}</p>
          <div className="button-row">
            <span className="pill">{copy.meta.languageName}</span>
            <LocaleToggle label={copy.common.languageToggleLabel} />
          </div>
        </div>

        <HoverActionButton href="/chat/new">{copy.settings.primaryAction}</HoverActionButton>
      </section>

      <section className="library-utility-card library-utility-card--stacked motion-slide-up motion-delay-1">
        <div>
          <h3>{links.title}</h3>
          <p className="muted-copy">{links.body}</p>
        </div>

        <div className="button-row button-row--compact">
          <Link href="/dashboard" className="button-small">
            {copy.common.backToDashboard}
          </Link>
          <Link href="/chat/new" className="button-small">
            {copy.common.openWorkspace}
          </Link>
        </div>
      </section>
    </div>
  );
}
