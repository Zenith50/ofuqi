"use client";

import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <main id="main" className="status-page">
      <h1>{copy.common.errorTitle}</h1>
      <p role="alert">{copy.common.errorBody}</p>
      <button type="button" className="button-primary" onClick={reset}>
        {copy.common.retry}
      </button>
    </main>
  );
}
