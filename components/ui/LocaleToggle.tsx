"use client";

import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";

type LocaleToggleProps = {
  label?: string;
  compact?: boolean;
};

export default function LocaleToggle({ label, compact = false }: LocaleToggleProps) {
  const { locale, setLocale } = useAppLocale();
  const copy = getCopy(locale);
  const ariaLabel = label ?? copy.common.languageToggleLabel;

  return (
    <div className={`locale-toggle ${compact ? "locale-toggle--compact" : ""}`}>
      {label ? <span className="locale-toggle-label">{label}</span> : null}
      <div className="locale-toggle-buttons" role="group" aria-label={ariaLabel}>
        <button
          type="button"
          className={locale === "en" ? "active" : undefined}
          onClick={() => setLocale("en")}
          aria-pressed={locale === "en"}
        >
          EN
        </button>
        <button
          type="button"
          className={locale === "ar" ? "active" : undefined}
          onClick={() => setLocale("ar")}
          aria-pressed={locale === "ar"}
        >
          AR
        </button>
      </div>
    </div>
  );
}
