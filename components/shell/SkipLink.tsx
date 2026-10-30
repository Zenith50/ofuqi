"use client";

import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";

export default function SkipLink() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <a className="skip-link" href="#main">
      {copy.common.skipToContent}
    </a>
  );
}
