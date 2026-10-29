"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import SheetFrame from "@/components/cv/SheetFrame";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import HoverActionButton from "@/components/ui/HoverActionButton";
import TextShimmer from "@/components/ui/TextShimmer";
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
            <p className="section-kicker">
              <TextShimmer>{copy.landing.kicker}</TextShimmer>
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
            <ul className="spec-row">
              {copy.landing.stats.map((stat) => (
                <li key={stat.label} className="spec-chip">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <div className="hero-stage">
            <section className="instrument instrument--sheet" aria-label={copy.landing.heroCaptionRight}>
              <header className="instrument-head">
                <p className="instrument-kicker">{copy.landing.heroCaptionRight}</p>
                <span className="badge badge--outline">{copy.landing.heroCaptionLeft}</span>
              </header>
              <div className="instrument-well instrument-well--sheet">
                <SheetFrame templateKey="ats" sampleLocale={locale} className="sheet-frame--hero" />
              </div>
            </section>
          </div>
        </section>

        <section id="features" className="feature-strip">
          {copy.landing.features.map((feature) => (
            <article key={feature.id} className="card feature-card">
              <header className="card-header">
                <p className="instrument-kicker">{feature.id}</p>
                <h2 className="card-title">{feature.title}</h2>
              </header>
              <div className="card-content">
                <p className="card-description">{feature.body}</p>
              </div>
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
                <article key={item.title} className="card gallery-card">
                  <SheetFrame templateKey={templateKey} sampleLocale={locale} />
                  <div className="card-content">
                    <span className="badge">{item.id}</span>
                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-description">{item.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="card cta-banner">
          <header className="card-header">
            <p className="instrument-kicker">{copy.landing.cta.kicker}</p>
            <h2 className="card-title">{copy.landing.cta.title}</h2>
            <p className="card-description">{copy.landing.cta.body}</p>
          </header>
          <footer className="card-footer">
            <HoverActionButton href="/sign-in">{copy.landing.cta.primary}</HoverActionButton>
            <Link href="/dashboard" className="button-secondary">
              {copy.landing.cta.secondary}
            </Link>
          </footer>
        </section>
      </main>

      <footer className="landing-footer">
        <span>{copy.landing.footerLeft}</span>
        <span>{copy.landing.footerRight}</span>
      </footer>
    </>
  );
}
