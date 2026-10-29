"use client";

import Link from "next/link";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";

export default function BrandLockup({
  href,
  subtitle = true,
}: {
  href?: string;
  subtitle?: boolean;
}) {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const content = (
    <span className="brand-copy">
      <span className="brand-pair">
        <strong lang="en" dir="ltr">Ofuqi</strong>
        <span className="brand-arabic" lang="ar" dir="rtl">أُفُقي</span>
      </span>
      {subtitle ? <span className="brand-sub">{copy.common.brandSubtitle}</span> : null}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="brand-lockup">
        {content}
      </Link>
    );
  }

  return <div className="brand-lockup">{content}</div>;
}
