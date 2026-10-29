"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import SheetFrame from "@/components/cv/SheetFrame";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import HoverActionButton from "@/components/ui/HoverActionButton";
import { getCopy } from "@/lib/app/content";
import { motionEase } from "@/lib/ui/motion";
import { CV_TEMPLATE_KEYS } from "@/lib/cv/templates";

export default function LandingPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const reduced = useReducedMotion();

  return (
    <>
      <main id="main">
        <section className="landing-hero">
          <motion.div
            className="hero-copy"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: motionEase }}
          >
            <h1 className="hero-title">
              <span>{copy.landing.titleStart}</span>
              <span>{copy.landing.titleEmphasis}</span>
            </h1>
            <p className="hero-note">{copy.landing.lead}</p>
            <div className="button-row" id="studio">
              <HoverActionButton href="/sign-in">{copy.landing.actions.primary}</HoverActionButton>
              <a href="#gallery" className="button-secondary">
                {copy.landing.actions.secondary}
              </a>
            </div>
          </motion.div>

          <div className="hero-stage">
            <SheetFrame templateKey="ats" sampleLocale={locale} className="sheet-frame--hero" />
          </div>

          <div id="features" className="feature-columns">
            {copy.landing.features.map((feature) => (
              <article key={feature.title} className="feature-column">
                <h2>{feature.title}</h2>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="gallery" className="gallery-section">
          <div className="gallery-header">
            <h2>{copy.landing.galleryTitle}</h2>
            <p className="gallery-lead">{copy.landing.galleryLead}</p>
          </div>

          <div className="gallery-grid">
            {copy.landing.gallery.map((item, index) => {
              const templateKey = CV_TEMPLATE_KEYS[index] ?? "ats";

              return (
                <article key={item.title} className="gallery-card">
                  <SheetFrame templateKey={templateKey} sampleLocale={locale} />
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="cta-band">
          <div className="cta-banner">
            <div className="cta-copy">
              <h2>{copy.landing.cta.title}</h2>
              <p>{copy.landing.cta.body}</p>
            </div>
            <div className="button-row">
              <HoverActionButton href="/sign-in">{copy.landing.cta.primary}</HoverActionButton>
              <Link href="/dashboard" className="button-secondary">
                {copy.landing.cta.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p className="footer-name">{copy.landing.footerLeft}</p>
        <p className="footer-note">{copy.landing.footerRight}</p>
      </footer>
    </>
  );
}
