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
    <>
      <span className="brand-mark" aria-hidden="true">{copy.common.brandMark}</span>
      <span className="brand-copy">
        <strong>{copy.common.brandTitle}</strong>
        {subtitle ? <span>{copy.common.brandSubtitle}</span> : null}
      </span>
    </>
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
