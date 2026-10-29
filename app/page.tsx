"use client";

import { useState, useSyncExternalStore } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";

import LocaleToggle from "@/components/ui/LocaleToggle";
import HoverActionButton from "@/components/ui/HoverActionButton";
import TextShimmer from "@/components/ui/TextShimmer";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";
import { buildWorkspaceHref } from "@/lib/cv/projects";
import { CV_TEMPLATE_KEYS, getCvTemplateStageClassName } from "@/lib/cv/templates";
import type { CvProjectTemplateKey } from "@/lib/cv/templates";

const entranceEase = [0.22, 1, 0.36, 1] as [number, number, number, number];

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: entranceEase },
  },
};

const sectionVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const previewEase = { duration: 0.2, ease: entranceEase };

const stageDelayClassNames = ["", "motion-delay-2", "motion-delay-3"];

function subscribeToReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return true;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

function LandingKicker({ children }: { children: string }) {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return children;
  }

  return <TextShimmer>{children}</TextShimmer>;
}

function moveTemplateSelection(
  event: KeyboardEvent<HTMLButtonElement>,
  index: number,
  direction: "ltr" | "rtl",
  idPrefix: string,
  onSelect: (templateKey: CvProjectTemplateKey) => void,
) {
  const count = CV_TEMPLATE_KEYS.length;
  const nextKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
  const previousKey = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
  let nextIndex: number | null = null;

  if (event.key === nextKey || event.key === "ArrowDown") {
    nextIndex = (index + 1) % count;
  } else if (event.key === previousKey || event.key === "ArrowUp") {
    nextIndex = (index - 1 + count) % count;
  }

  if (nextIndex === null) {
    return;
  }

  event.preventDefault();
  const templateKey = CV_TEMPLATE_KEYS[nextIndex];
  onSelect(templateKey);
  document.getElementById(`${idPrefix}-${templateKey}`)?.focus();
}

function TemplateChoice({
  label,
  selectedTemplate,
  labels,
  direction,
  idPrefix,
  onSelect,
}: {
  label: string;
  selectedTemplate: CvProjectTemplateKey;
  labels: Record<CvProjectTemplateKey, string>;
  direction: "ltr" | "rtl";
  idPrefix: string;
  onSelect: (templateKey: CvProjectTemplateKey) => void;
}) {
  return (
    <div className="segmented-control" role="radiogroup" aria-label={label}>
      {CV_TEMPLATE_KEYS.map((templateKey, index) => {
        const selected = templateKey === selectedTemplate;

        return (
          <button
            key={templateKey}
            id={`${idPrefix}-${templateKey}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-controls="landing-template-preview"
            tabIndex={selected ? 0 : -1}
            className={selected ? "segmented-button active" : "segmented-button"}
            onClick={() => onSelect(templateKey)}
            onKeyDown={(event) => moveTemplateSelection(event, index, direction, idPrefix, onSelect)}
          >
            {selected ? <motion.span layoutId="landing-template-active" className="segmented-active" /> : null}
            <span className="segmented-label">{labels[templateKey]}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function LandingPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const [selectedTemplate, setSelectedTemplate] = useState<CvProjectTemplateKey>("ats");
  const landingTemplates = CV_TEMPLATE_KEYS.flatMap((templateKey, index) => {
    const item = copy.landing.gallery[index];
    return item ? [{ templateKey, item, index }] : [];
  });
  const selectedLandingTemplate =
    landingTemplates.find((entry) => entry.templateKey === selectedTemplate) ?? landingTemplates[0];
  const studioHref = buildWorkspaceHref({
    templateKey: selectedTemplate,
    language: locale,
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className="site-shell">
        <motion.header className="landing-nav" initial="hidden" animate="visible" variants={sectionVariants}>
          <motion.div className="landing-nav-inner" variants={sectionVariants}>
            <motion.div className="brand-lockup" variants={itemVariants}>
              <span className="brand-mark">{copy.common.brandMark}</span>
              <div className="brand-copy">
                <h2>{copy.common.brandTitle}</h2>
                <p>{copy.common.brandSubtitle}</p>
              </div>
            </motion.div>

            <motion.nav className="landing-nav-links" variants={itemVariants}>
              <a href="#features">{copy.landing.nav.features}</a>
              <a href="#gallery">{copy.landing.nav.gallery}</a>
              <a href="#studio">{copy.landing.nav.studio}</a>
              <LocaleToggle compact />
              <Link href="/sign-in" className="button-secondary">
                {copy.common.accessStudio}
              </Link>
            </motion.nav>
          </motion.div>
        </motion.header>

        <main>
          <motion.section className="landing-hero" initial="hidden" animate="visible" variants={sectionVariants}>
            <motion.div className="hero-copy" variants={itemVariants}>
              <span className="section-kicker">
                <LandingKicker>{copy.landing.kicker}</LandingKicker>
              </span>
              <h1 className="hero-title">
                <span>{copy.landing.titleStart}</span>
                <em>{copy.landing.titleEmphasis}</em>
              </h1>

              <div className="hero-support">
                <p className="hero-note">{copy.landing.lead}</p>
              </div>

              <TemplateChoice
                label={copy.landing.galleryTitle}
                selectedTemplate={selectedTemplate}
                labels={copy.dashboard.templateNames}
                direction={copy.meta.dir}
                idPrefix="landing-hero-template"
                onSelect={setSelectedTemplate}
              />

              <div className="button-row" id="studio">
                <HoverActionButton href={studioHref}>{copy.landing.actions.primary}</HoverActionButton>
                <a href="#gallery" className="button-secondary">
                  {copy.landing.actions.secondary}
                </a>
                <span className="pill">{copy.dashboard.templateNames[selectedTemplate]}</span>
              </div>
            </motion.div>

            <motion.div className="hero-stage" variants={itemVariants}>
              <div className="hero-orbit" />
              <div className="hero-card-stack glass-panel motion-float">
                <div className="hero-document">
                  <div className="document-caption">
                    <span>{copy.landing.heroCaptionLeft}</span>
                    <span>{copy.dashboard.templateNames[selectedTemplate]}</span>
                  </div>

                  <div id="landing-template-preview">
                    {selectedLandingTemplate ? (
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={selectedLandingTemplate.templateKey}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={previewEase}
                        >
                          <h2 className="document-main-title">{selectedLandingTemplate.item.title}</h2>
                          <p className="document-subtitle">{selectedLandingTemplate.item.id}</p>
                          <div
                            className={getCvTemplateStageClassName(selectedLandingTemplate.templateKey)}
                            style={{ minHeight: "9.5rem" }}
                            aria-hidden="true"
                          />
                        </motion.div>
                      </AnimatePresence>
                    ) : null}
                  </div>

                  <div className="document-grid">
                    <div className="document-pane">
                      <div className="mini-caption">
                        <span>{copy.landing.documentInterview}</span>
                        <span>{locale === "ar" ? "ذكي" : "AI"}</span>
                      </div>
                      <div className="document-bullet-list">
                        {copy.landing.heroBullets.map((bullet) => (
                          <div key={bullet} className="document-bullet">
                            {bullet}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="document-pane">
                      <div className="mini-caption">
                        <span>{copy.landing.documentLanguages}</span>
                        <span>{locale === "en" ? "EN / AR" : "ع / EN"}</span>
                      </div>
                      <div className="document-line" style={{ width: "82%" }} />
                      <div className="document-line" style={{ width: "60%" }} />
                      <p className="locale-preview-line">{copy.meta.languageName}</p>
                    </div>
                  </div>

                  <div className="hero-stats">
                    {copy.landing.stats.map((stat) => (
                      <div key={stat.label} className="hero-stat motion-pulse-soft">
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.section>

          <motion.section
            id="features"
            className="feature-strip"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            {copy.landing.features.map((feature) => (
              <motion.article key={feature.id} className="feature-card" variants={itemVariants}>
                <p>{feature.id}</p>
                <h3>{feature.title}</h3>
                <p className="muted-copy">{feature.body}</p>
              </motion.article>
            ))}
          </motion.section>

          <motion.section
            id="gallery"
            className="gallery-section"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <motion.div className="gallery-header" variants={itemVariants}>
              <div>
                <span className="section-kicker">{copy.landing.galleryKicker}</span>
                <h2>{copy.landing.galleryTitle}</h2>
              </div>
              <p className="muted-copy gallery-lead">{copy.landing.galleryLead}</p>
            </motion.div>

            <motion.div
              className="gallery-grid"
              role="radiogroup"
              aria-label={copy.landing.galleryTitle}
              variants={sectionVariants}
            >
              {landingTemplates.map(({ templateKey, item, index }) => {
                const selected = templateKey === selectedTemplate;
                const stageClassName = [
                  getCvTemplateStageClassName(templateKey),
                  "motion-float",
                  stageDelayClassNames[index] ?? "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <motion.article
                    key={templateKey}
                    data-template-key={templateKey}
                    className="gallery-card"
                    variants={itemVariants}
                    style={
                      selected
                        ? {
                            borderColor: "var(--primary-strong)",
                            boxShadow: "0 0 0 1px var(--primary-strong), var(--shadow-card)",
                          }
                        : undefined
                    }
                  >
                    <p>{item.id}</p>
                    <div className={stageClassName} aria-hidden="true" />
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    <div className="button-row">
                      <button
                        type="button"
                        id={`landing-gallery-${templateKey}`}
                        role="radio"
                        aria-checked={selected}
                        aria-controls="landing-template-preview"
                        tabIndex={selected ? 0 : -1}
                        className={selected ? "button-primary" : "button-secondary"}
                        onClick={() => setSelectedTemplate(templateKey)}
                        onKeyDown={(event) =>
                          moveTemplateSelection(event, index, copy.meta.dir, "landing-gallery", setSelectedTemplate)
                        }
                      >
                        {copy.dashboard.templateNames[templateKey]}
                      </button>
                      <Link
                        href={buildWorkspaceHref({ templateKey, language: locale })}
                        className="button-secondary"
                      >
                        {copy.templates.primary}
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </motion.section>

          <motion.section className="cta-banner" initial="hidden" animate="visible" variants={itemVariants}>
            <div>
              <span className="section-kicker">{copy.landing.cta.kicker}</span>
              <h2>{copy.landing.cta.title}</h2>
              <p>{copy.landing.cta.body}</p>
            </div>

            <div className="button-row">
              <span className="pill">{copy.dashboard.templateNames[selectedTemplate]}</span>
              <HoverActionButton href={studioHref}>{copy.landing.cta.primary}</HoverActionButton>
              <Link href="/dashboard" className="button-secondary">
                {copy.landing.cta.secondary}
              </Link>
            </div>
          </motion.section>
        </main>

        <motion.footer className="landing-footer" initial="hidden" animate="visible" variants={itemVariants}>
          <span>{copy.landing.footerLeft}</span>
          <span>{copy.landing.footerRight}</span>
        </motion.footer>
      </div>
    </MotionConfig>
  );
}
