"use client";

import SegmentedControl from "@/components/ui/SegmentedControl";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy, type AppLocale } from "@/lib/app/content";

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
      <SegmentedControl<AppLocale>
        compact={compact}
        ariaLabel={ariaLabel}
        value={locale}
        onChange={setLocale}
        options={[
          { value: "en", label: "EN" },
          { value: "ar", label: "AR" },
        ]}
      />
    </div>
  );
}
