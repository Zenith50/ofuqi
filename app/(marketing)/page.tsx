"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import SheetFrame from "@/components/cv/SheetFrame";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import HoverActionButton from "@/components/ui/HoverActionButton";
import { getCopy } from "@/lib/app/content";
import { isCvProjectTemplateKey, type CvProjectTemplateKey } from "@/lib/cv/templates";

function rise(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

export default function LandingPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const [proof, setProof] = useState<CvProjectTemplateKey>("ats");
  const activeProof = copy.landing.proofs.find((item) => item.id === proof) ?? copy.landing.proofs[0];
  const latinLead = locale === "en";

  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  return (
    <>
      <main id="main">
        <section className="landing-hero" id="top">
          <div className="hero-lead rise" style={rise(0)}>
            <p className="hero-note">{copy.landing.sentence}</p>
            <HoverActionButton href="/sign-in">{copy.landing.actions.primary}</HoverActionButton>
          </div>

          <h1 className="monument">
            <span className="monument-active" lang={latinLead ? "en" : "ar"} dir={latinLead ? "ltr" : "rtl"}>
              {latinLead ? "Ofuqi" : "أُفُقي"}
            </span>
          </h1>

          <figure className="hero-proof">
            <SheetFrame templateKey="ats" sampleLocale={locale} className="sheet-frame--insert" />
            <span className="registration" aria-hidden="true" />
          </figure>

          <p className="monument-companion rise" lang={latinLead ? "ar" : "en"} dir={latinLead ? "rtl" : "ltr"} style={rise(1)}>
            {latinLead ? "أُفُقي" : "Ofuqi"}
          </p>

          <div className="hero-foot rise" style={rise(2)}>
            <p>{copy.landing.kind}</p>
            <p>{copy.landing.output}</p>
          </div>
        </section>

        <section id="proofs" className="proof-split">
          <figure className="proof-plate">
            <SheetFrame templateKey={proof} sampleLocale={locale} className="sheet-frame--plate" />
          </figure>
          <div className="proof-copy">
            <div className="proof-tabs" role="tablist" aria-label={copy.landing.nav.gallery}>
              {copy.landing.proofs.map((item) => {
                const selected = item.id === proof;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`proof-tab-${item.id}`}
                    className={selected ? "proof-tab is-selected" : "proof-tab"}
                    aria-selected={selected}
                    aria-controls="proof-panel"
                    onClick={() => {
                      if (isCvProjectTemplateKey(item.id)) {
                        setProof(item.id);
                      }
                    }}
                  >
                    {item.title}
                  </button>
                );
              })}
            </div>
            <div id="proof-panel" role="tabpanel" aria-labelledby={`proof-tab-${activeProof.id}`}>
              <h2>{copy.landing.showcaseTitle}</h2>
              <p className="proof-body">{activeProof.body}</p>
            </div>
            <div className="proof-actions">
              <HoverActionButton href="/sign-in">{copy.landing.actions.primary}</HoverActionButton>
              <a className="proof-action" href="#formats">{copy.landing.actions.secondary}</a>
            </div>
          </div>
        </section>

        <section id="formats" className="format-field">
          <div className="format-heading">
            <h2 className="format-title" lang="ar" dir="rtl">العربية</h2>
            <p className="format-title format-title-latin" lang="en" dir="ltr">English</p>
          </div>
          <div className="format-prints">
            {copy.landing.proofs.map((item, index) => {
              const templateKey = isCvProjectTemplateKey(item.id) ? item.id : "ats";
              return (
                <figure key={item.id} className={`format-print format-print--${index + 1}`}>
                  <SheetFrame templateKey={templateKey} sampleLocale={locale} className="sheet-frame--print" />
                </figure>
              );
            })}
          </div>
          <p className="format-sentence">{copy.landing.formatSentence}</p>
        </section>

        <a className="cta-band" id="studio" href="/sign-in" aria-label={copy.landing.actions.primary}>
          <span className="cta-sentence">{copy.landing.ctaSentence}</span>
          <svg className="cta-arrow" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M14 34 L34 14 M18 14 H34 V30" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="cta-word">{copy.landing.ctaWord}</span>
        </a>
      </main>

      <footer className="landing-footer">
        <p className="footer-name" lang={latinLead ? "en" : "ar"} dir={latinLead ? "ltr" : "rtl"}>
          {latinLead ? "Ofuqi" : "أُفُقي"}
        </p>
        <div className="footer-grid">
          <div className="footer-places">
            <Link href="/sign-in">{copy.landing.places.signIn}</Link>
            <Link href="/dashboard">{copy.landing.places.library}</Link>
            <Link href="/dashboard/templates">{copy.landing.places.templates}</Link>
          </div>
          <nav className="footer-links" aria-label={copy.common.onThisPage}>
            <a href="#proofs">{copy.landing.nav.features}</a>
            <a href="#formats">{copy.landing.nav.gallery}</a>
            <a href="#studio">{copy.landing.nav.studio}</a>
          </nav>
        </div>
        <div className="footer-end">
          <p>{copy.landing.footerRight}</p>
          <a href="#top">{copy.landing.footerTop}</a>
        </div>
      </footer>
    </>
  );
}
