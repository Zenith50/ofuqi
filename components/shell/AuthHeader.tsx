"use client";

import Link from "next/link";
import BrandLockup from "@/components/shell/BrandLockup";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import LocaleToggle from "@/components/ui/LocaleToggle";
import { getCopy } from "@/lib/app/content";

export default function AuthHeader() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <header className="auth-header">
      <BrandLockup href="/" subtitle={false} />
      <div className="auth-header-tools">
        <LocaleToggle compact />
        <Link href="/" className="button-secondary">
          {copy.common.backToLanding}
        </Link>
      </div>
    </header>
  );
}
