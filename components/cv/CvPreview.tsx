"use client";

import type { ReactNode } from "react";
import { getPreviewContact, type CvData, type GeneratorLocale } from "@/lib/cv/demoData";
import { formatCertification, formatDateRange, formatLanguageLevel } from "@/lib/cv/presentation";
import type { CvProjectTemplateKey } from "@/lib/cv/templates";

type CvPreviewProps = {
  data: CvData;
  previewLocale: GeneratorLocale;
  templateKey: CvProjectTemplateKey;
};

export default function CvPreview({ data, previewLocale, templateKey }: CvPreviewProps) {
  const isArabic = data.language === "ar";
  const contactItems = getPreviewContact(data);
  const experience = asArray(data.experience);
  const education = asArray(data.education);
  const skills = asArray(data.skills);
  const certifications = asArray(data.certifications);
  const languages = asArray(data.languages);
  const rootClassName = [
    "preview-paper",
    `preview-paper--${templateKey}`,
    isArabic ? "preview-paper--rtl" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (templateKey === "ada") {
    return (
      <div className={rootClassName}>
        <header className="preview-paper-header preview-paper-header--ada">
          <div className="preview-paper-header-copy">
            <h1 className="preview-paper-name">{data.personal.fullName}</h1>
            <p className="preview-paper-role">{data.personal.jobTitle}</p>
          </div>

          {data.summary ? <p className="preview-paper-header-summary">{data.summary}</p> : null}
        </header>

        <div className="preview-paper-grid preview-paper-grid--ada">
          <aside className="preview-paper-sidebar">
            {contactItems.length > 0 ? (
              <PreviewSidebarSection label={data.language === "ar" ? "التواصل" : "Contact"}>
                <div className="preview-paper-contact-stack">
                  {contactItems.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="preview-paper-contact-stack-item"
                      dir={/[A-Za-z@.+0-9/-]/.test(item) ? "ltr" : undefined}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </PreviewSidebarSection>
            ) : null}

            {skills.length > 0 ? (
              <PreviewSidebarSection label={previewLocale.sections.skills}>
                <p className="preview-paper-body">{skills.join(" \u2022 ")}</p>
              </PreviewSidebarSection>
            ) : null}

            {certifications.length > 0 ? (
              <PreviewSidebarSection label={previewLocale.sections.certifications}>
                <ul className="preview-paper-list preview-paper-list--sidebar">
                  {certifications.map((item) => (
                    <li key={`${item.name}-${item.date}`}>{formatCertification(item)}</li>
                  ))}
                </ul>
              </PreviewSidebarSection>
            ) : null}

            {languages.length > 0 ? (
              <PreviewSidebarSection label={previewLocale.sections.languages}>
                <p className="preview-paper-body">{languages.map((item) => formatLanguageLevel(item)).join(" \u2022 ")}</p>
              </PreviewSidebarSection>
            ) : null}
          </aside>

          <div className="preview-paper-main">
            {experience.length > 0 ? (
              <PreviewExperienceSection
                entries={experience}
                isArabic={isArabic}
                label={previewLocale.sections.experience}
              />
            ) : null}

            {education.length > 0 ? (
              <PreviewEducationSection
                entries={education}
                isArabic={isArabic}
                label={previewLocale.sections.education}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      <header className={`preview-paper-header ${templateKey === "harvard" ? "preview-paper-header--harvard" : ""}`.trim()}>
        <h1 className="preview-paper-name">{data.personal.fullName}</h1>
        <p className="preview-paper-role">{data.personal.jobTitle}</p>

        {contactItems.length > 0 ? (
          <div className="preview-paper-contact-row">
            {contactItems.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="preview-paper-contact-item"
                dir={/[A-Za-z@.+0-9/-]/.test(item) ? "ltr" : undefined}
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="preview-paper-divider" />

      {data.summary ? (
        <PreviewContentSection label={previewLocale.sections.summary}>
          <p className="preview-paper-body">{data.summary}</p>
        </PreviewContentSection>
      ) : null}

      {experience.length > 0 ? (
        <PreviewExperienceSection
          entries={experience}
          isArabic={isArabic}
          label={previewLocale.sections.experience}
        />
      ) : null}

      {education.length > 0 ? (
        <PreviewEducationSection
          entries={education}
          isArabic={isArabic}
          label={previewLocale.sections.education}
        />
      ) : null}

      {skills.length > 0 ? (
        <PreviewContentSection label={previewLocale.sections.skills}>
          <p className="preview-paper-body">{skills.join(" \u2022 ")}</p>
        </PreviewContentSection>
      ) : null}

      {certifications.length > 0 ? (
        <PreviewContentSection label={previewLocale.sections.certifications}>
          <ul className="preview-paper-list">
            {certifications.map((item) => (
              <li key={`${item.name}-${item.date}`}>{formatCertification(item)}</li>
            ))}
          </ul>
        </PreviewContentSection>
      ) : null}

      {languages.length > 0 ? (
        <PreviewContentSection label={previewLocale.sections.languages}>
          <p className="preview-paper-body">{languages.map((item) => formatLanguageLevel(item)).join(" \u2022 ")}</p>
        </PreviewContentSection>
      ) : null}
    </div>
  );
}

function PreviewContentSection({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section className="preview-paper-section">
      <p className="preview-paper-label">{label}</p>
      {children}
    </section>
  );
}

function PreviewSidebarSection({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section className="preview-paper-side-section">
      <p className="preview-paper-label preview-paper-label--sidebar">{label}</p>
      {children}
    </section>
  );
}

function PreviewExperienceSection({
  entries,
  isArabic,
  label,
}: {
  entries: CvData["experience"];
  isArabic: boolean;
  label: string;
}) {
  return (
    <PreviewContentSection label={label}>
      <div className="preview-entry-stack">
        {asArray(entries).map((item) => {
          const achievements = asArray(item.achievements);

          return (
            <article key={`${item.company}-${item.role}`} className="preview-entry">
              <div className="preview-entry-head">
                {isArabic ? (
                  <div className="preview-entry-main">
                    <p className="preview-entry-role">{item.role}</p>
                    <p className="preview-entry-date">{formatDateRange(item.startDate, item.endDate)}</p>
                    <p className="preview-entry-company">{item.company}</p>
                  </div>
                ) : (
                  <>
                    <div className="preview-entry-main">
                      <p className="preview-entry-role">{item.role}</p>
                      <p className="preview-entry-company">{item.company}</p>
                    </div>
                    <p className="preview-entry-date">{formatDateRange(item.startDate, item.endDate)}</p>
                  </>
                )}
              </div>

              {achievements.length > 0 ? (
                <ul className="preview-paper-list">
                  {achievements.map((achievement) => (
                    <li key={achievement}>{achievement}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        })}
      </div>
    </PreviewContentSection>
  );
}

function PreviewEducationSection({
  entries,
  isArabic,
  label,
}: {
  entries: CvData["education"];
  isArabic: boolean;
  label: string;
}) {
  return (
    <PreviewContentSection label={label}>
      <div className="preview-entry-stack">
        {asArray(entries).map((item) => (
          <article key={`${item.institution}-${item.degree}`} className="preview-entry">
            <div className="preview-entry-head">
              {isArabic ? (
                <div className="preview-entry-main">
                  <p className="preview-entry-role">{item.degree}</p>
                  <p className="preview-entry-date">{formatDateRange(item.startDate, item.endDate)}</p>
                  <p className="preview-entry-company">{item.institution}</p>
                </div>
              ) : (
                <>
                  <div className="preview-entry-main">
                    <p className="preview-entry-role">{item.degree}</p>
                    <p className="preview-entry-company">{item.institution}</p>
                  </div>
                  <p className="preview-entry-date">{formatDateRange(item.startDate, item.endDate)}</p>
                </>
              )}
            </div>

            {item.details ? <p className="preview-entry-detail">{item.details}</p> : null}
          </article>
        ))}
      </div>
    </PreviewContentSection>
  );
}

function asArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? value.slice() : [];
}
