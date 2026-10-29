"use client";

import CvPreview from "@/components/cv/CvPreview";
import { getDemoCv, getGeneratorLocale, type CvData } from "@/lib/cv/demoData";
import type { AppLocale } from "@/lib/app/content";
import type { CvProjectTemplateKey } from "@/lib/cv/templates";

export default function SheetFrame({
  templateKey,
  data,
  sampleLocale = "en",
  className,
}: {
  templateKey: CvProjectTemplateKey;
  data?: CvData;
  sampleLocale?: AppLocale;
  className?: string;
}) {
  const sheet = data ?? getDemoCv(sampleLocale);

  return (
    <div className={["sheet-frame", className].filter(Boolean).join(" ")} aria-hidden="true">
      <div className="sheet-frame__scale">
        <CvPreview
          data={sheet}
          previewLocale={getGeneratorLocale(sheet.language)}
          templateKey={templateKey}
        />
      </div>
    </div>
  );
}
