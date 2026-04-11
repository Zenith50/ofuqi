"use client";

import { getPreviewContact, type CvData } from "@/lib/cv/demoData";
import type { CvProjectTemplateKey } from "@/lib/cv/templates";

type CvCardPreviewProps = {
  data: CvData;
  templateKey: CvProjectTemplateKey;
  className?: string;
};

export default function CvCardPreview({ data, templateKey, className }: CvCardPreviewProps) {
  const contactItems = getPreviewContact(data).slice(0, 3);
  const experienceItems = data.experience.slice(0, 2);
  const summarySnippet = data.summary;
  const skills = data.skills.slice(0, templateKey === "ada" ? 4 : 3);
  const rootClassName = [
    "cv-card-preview",
    `cv-card-preview--${templateKey}`,
    data.language === "ar" ? "cv-card-preview--rtl" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (templateKey === "ada") {
    return (
      <div className={rootClassName}>
        <aside className="cv-card-preview__sidebar">
          <div className="cv-card-preview__sidebar-block">
            <span className="cv-card-preview__eyebrow">{data.language === "ar" ? "التواصل" : "Contact"}</span>
            {contactItems.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="cv-card-preview__contact-item"
                dir={/[A-Za-z@.+0-9/-]/.test(item) ? "ltr" : undefined}
              >
                {item}
              </span>
            ))}
          </div>

          <div className="cv-card-preview__sidebar-block">
            <span className="cv-card-preview__eyebrow">{data.language === "ar" ? "المهارات" : "Skills"}</span>
            <div className="cv-card-preview__chip-stack">
              {skills.map((skill) => (
                <span key={skill} className="cv-card-preview__chip">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <div className="cv-card-preview__main">
          <div className="cv-card-preview__header">
            <strong className="cv-card-preview__name">{data.personal.fullName}</strong>
            <span className="cv-card-preview__role">{data.personal.jobTitle}</span>
          </div>

          <div className="cv-card-preview__summary-block">
            <p className="cv-card-preview__summary">{summarySnippet}</p>
          </div>

          <div className="cv-card-preview__list">
            {experienceItems.map((item) => (
              <article key={`${item.company}-${item.role}`} className="cv-card-preview__entry">
                <div className="cv-card-preview__entry-head">
                  <strong>{item.role}</strong>
                  <span>{item.company}</span>
                </div>
                <p>{item.achievements[0]}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      <div className="cv-card-preview__header">
        <strong className="cv-card-preview__name">{data.personal.fullName}</strong>
        <span className="cv-card-preview__role">{data.personal.jobTitle}</span>
      </div>

      <div className="cv-card-preview__contact-row">
        {contactItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="cv-card-preview__contact-pill"
            dir={/[A-Za-z@.+0-9/-]/.test(item) ? "ltr" : undefined}
          >
            {item}
          </span>
        ))}
      </div>

      <div className="cv-card-preview__summary-block">
        <p className="cv-card-preview__summary">{summarySnippet}</p>
      </div>

      <div className="cv-card-preview__list">
        {experienceItems.map((item) => (
          <article key={`${item.company}-${item.role}`} className="cv-card-preview__entry">
            <div className="cv-card-preview__entry-head">
              <strong>{item.role}</strong>
              <span>{item.company}</span>
            </div>
            <p>{item.achievements[0]}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
