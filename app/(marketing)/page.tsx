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
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: motionEase }}
          >
            <p className="section-kicker">{copy.landing.kicker}</p>
            <p className="hero-caption">
              <span>{copy.landing.heroCaptionLeft}</span>
              <span aria-hidden="true">·</span>
              <span>{copy.landing.heroCaptionRight}</span>
            </p>
            <h1 className="hero-title">
              <span>{copy.landing.titleStart}</span>{" "}
              <em>{copy.landing.titleEmphasis}</em>
            </h1>
            <p className="hero-note">{copy.landing.lead}</p>
            <div className="button-row" id="studio">
              <HoverActionButton href="/sign-in">{copy.landing.actions.primary}</HoverActionButton>
              <a href="#gallery" className="button-secondary">
                {copy.landing.actions.secondary}
              </a>
            </div>
            <dl className="density-metrics">
              {copy.landing.stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
            <ul className="density-rows">
              {copy.landing.heroBullets.map((bullet, index) => (
                <li key={bullet}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </motion.div>

          <div className="hero-stage">
            <SheetFrame templateKey="ats" sampleLocale={locale} className="sheet-frame--hero" />
          </div>
        </section>

        <section id="features" className="feature-strip">
          {copy.landing.features.map((feature) => (
            <article key={feature.id} className="feature-card">
              <span className="meta-badge">{feature.id}</span>
              <h2>{feature.title}</h2>
              <p className="muted-copy">{feature.body}</p>
            </article>
          ))}
        </section>

        <section id="gallery" className="gallery-section">
          <div className="gallery-header">
            <div>
              <p className="section-kicker">{copy.landing.galleryKicker}</p>
              <h2>{copy.landing.galleryTitle}</h2>
            </div>
            <p className="muted-copy gallery-lead">{copy.landing.galleryLead}</p>
          </div>

          <div className="gallery-grid">
            {copy.landing.gallery.map((item, index) => {
              const templateKey = CV_TEMPLATE_KEYS[index] ?? "ats";

              return (
                <article key={item.title} className="gallery-card">
                  <SheetFrame templateKey={templateKey} sampleLocale={locale} />
                  <div className="gallery-card-copy">
                    <span className="meta-badge">{item.id}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="cta-banner">
          <div className="cta-banner-copy">
            <p className="section-kicker">{copy.landing.cta.kicker}</p>
            <h2>{copy.landing.cta.title}</h2>
            <p>{copy.landing.cta.body}</p>
          </div>
          <ul className="library-specs">
            {copy.landing.gallery.map((item) => (
              <li key={item.id} className="meta-badge">{item.title}</li>
            ))}
          </ul>
          <div className="button-row">
            <HoverActionButton href="/sign-in">{copy.landing.cta.primary}</HoverActionButton>
            <Link href="/dashboard" className="button-secondary">
              {copy.landing.cta.secondary}
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <span>{copy.landing.footerLeft}</span>
        <span>{copy.landing.footerRight}</span>
      </footer>
    </>
  );
}
