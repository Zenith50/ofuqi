"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import HoverActionButton from "@/components/ui/HoverActionButton";
import CvCardPreview from "@/components/cv/CvCardPreview";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";
import { buildWorkspaceHref, createStarterCvProject } from "@/lib/cv/projects";
import { CV_TEMPLATE_KEYS, type CvProjectTemplateKey } from "@/lib/cv/templates";

const TEMPLATE_CHOOSER_ID = "template-chooser";
const TEMPLATE_CHOOSER_HASH = `#${TEMPLATE_CHOOSER_ID}`;

type TemplateCardCopy = {
  tag: string;
  title: string;
  roles: string;
  support: string;
  body: string;
};

type TemplatePickerCard = TemplateCardCopy & {
  templateKey: CvProjectTemplateKey;
};

function subscribeToLocationHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function readTemplateChooserActive() {
  return window.location.hash === TEMPLATE_CHOOSER_HASH;
}

function useTemplateChooserActive() {
  return useSyncExternalStore(subscribeToLocationHash, readTemplateChooserActive, () => false);
}

function resolveTemplatePickerCards(
  cards: readonly TemplateCardCopy[],
  templateNames: Record<CvProjectTemplateKey, string>,
): TemplatePickerCard[] {
  return CV_TEMPLATE_KEYS.flatMap((templateKey) => {
    const canonicalTitle = templateNames[templateKey];
    const card = cards.find((entry) => entry.title === canonicalTitle);

    if (!card) {
      return [];
    }

    return [{ ...card, templateKey }];
  });
}

export default function TemplatesPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const chooserRef = useRef<HTMLElement>(null);
  const chooserActive = useTemplateChooserActive();
  const pickerCards = resolveTemplatePickerCards(copy.templates.cards, copy.dashboard.templateNames);

  useEffect(() => {
    if (!chooserActive) {
      return;
    }

    chooserRef.current?.focus({ preventScroll: true });
  }, [chooserActive]);

  function openTemplateChooser() {
    if (window.location.hash !== TEMPLATE_CHOOSER_HASH) {
      window.location.hash = TEMPLATE_CHOOSER_ID;
      return;
    }

    chooserRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="library-page">
      <section className="library-hero motion-slide-up">
        <div className="library-hero-copy">
          <p className="workspace-label">{copy.templates.headingLabel}</p>
          <h1 className="workspace-title">{copy.templates.headingTitle}</h1>
          <p className="muted-copy workspace-heading-copy">{copy.templates.headingBody}</p>
        </div>

        <HoverActionButton type="button" aria-controls={TEMPLATE_CHOOSER_ID} onClick={openTemplateChooser}>
          {copy.templates.primary}
        </HoverActionButton>
      </section>

      <section
        ref={chooserRef}
        id={TEMPLATE_CHOOSER_ID}
        tabIndex={-1}
        aria-label={copy.templates.headingTitle}
        data-chooser-state={chooserActive ? "active" : "idle"}
        className="library-card-grid motion-slide-up motion-delay-1"
        style={{ scrollMarginTop: "5.5rem" }}
      >
        {pickerCards.map((card, index) => {
          const starterProject = createStarterCvProject(card.templateKey, locale);

          return (
            <article key={card.templateKey} data-template-key={card.templateKey} className="library-card library-card--template">
              <CvCardPreview
                data={starterProject.variant}
                templateKey={card.templateKey}
                className={`library-template-stage motion-float motion-delay-${Math.min(index + 1, 3)}`}
              />

              <div className="library-card-copy">
                <div className="library-card-top">
                  <div className="library-card-pills">
                    <span className="pill">{card.tag}</span>
                  </div>
                  <span className="library-language-badge">{card.support}</span>
                </div>

                <h3>{card.title}</h3>
                <p className="library-card-role">{card.roles}</p>
                <p className="library-card-summary">{card.body}</p>
              </div>

              <div className="library-card-actions">
                <HoverActionButton href={buildWorkspaceHref({ templateKey: card.templateKey })} className="library-card-primary">
                  {copy.templates.primary}
                </HoverActionButton>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
