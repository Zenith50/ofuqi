"use client";

import Link from "next/link";
import BrandLockup from "@/components/shell/BrandLockup";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import LocaleToggle from "@/components/ui/LocaleToggle";
import { getCopy } from "@/lib/app/content";

export default function MarketingHeader() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <header className="mkt-header">
      <div className="mkt-header-inner">
        <BrandLockup href="/" />
        <nav className="mkt-links" aria-label={copy.common.onThisPage}>
          <a href="#proofs">{copy.landing.nav.features}</a>
          <a href="#formats">{copy.landing.nav.gallery}</a>
          <a href="#studio">{copy.landing.nav.studio}</a>
        </nav>
        <details className="mkt-disclosure">
          <summary>{copy.common.onThisPage}</summary>
          <nav aria-label={copy.common.onThisPage}>
            <a href="#proofs">{copy.landing.nav.features}</a>
            <a href="#formats">{copy.landing.nav.gallery}</a>
            <a href="#studio">{copy.landing.nav.studio}</a>
          </nav>
        </details>
        <div className="mkt-header-tools">
          <LocaleToggle compact />
          <Link href="/sign-in" className="button-secondary">
            {copy.common.accessStudio}
          </Link>
        </div>
      </div>
    </header>
  );
}
