"use client";

import Link from "next/link";
import LocaleToggle from "@/components/ui/LocaleToggle";
import HoverActionButton from "@/components/ui/HoverActionButton";
import TextShimmer from "@/components/ui/TextShimmer";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";

const galleryStageClassNames = [
  "gallery-stage gallery-stage--ats motion-float",
  "gallery-stage gallery-stage--harvard motion-float motion-delay-2",
  "gallery-stage gallery-stage--ada motion-float motion-delay-3",
];

export default function LandingPage() {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  return (
    <div className="site-shell motion-page-enter">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="brand-lockup motion-slide-up">
            <span className="brand-mark">{copy.common.brandMark}</span>
            <div className="brand-copy">
              <h2>{copy.common.brandTitle}</h2>
              <p>{copy.common.brandSubtitle}</p>
            </div>
          </div>

          <nav className="landing-nav-links motion-slide-up motion-delay-1">
            <a href="#features">{copy.landing.nav.features}</a>
            <a href="#gallery">{copy.landing.nav.gallery}</a>
            <a href="#studio">{copy.landing.nav.studio}</a>
            <LocaleToggle compact />
            <Link href="/sign-in" className="button-secondary">
              {copy.common.accessStudio}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy motion-slide-up motion-delay-1">
            <span className="section-kicker">
              <TextShimmer>{copy.landing.kicker}</TextShimmer>
            </span>
            <h1 className="hero-title">
              <span>{copy.landing.titleStart}</span>
              <em>{copy.landing.titleEmphasis}</em>
            </h1>

            <div className="hero-support">
              <p className="hero-note">{copy.landing.lead}</p>
            </div>

            <div className="button-row" id="studio">
              <HoverActionButton href="/sign-in">
                {copy.landing.actions.primary}
              </HoverActionButton>
              <a href="#gallery" className="button-secondary">
                {copy.landing.actions.secondary}
              </a>
            </div>
          </div>

          <div className="hero-stage motion-slide-up motion-delay-2">
            <div className="hero-orbit" />
            <div className="hero-card-stack glass-panel motion-float">
              <div className="hero-document">
                <div className="document-caption">
                  <span>{copy.landing.heroCaptionLeft}</span>
                  <span>{copy.landing.heroCaptionRight}</span>
                </div>

                <h2 className="document-main-title">{copy.landing.documentTitle}</h2>
                <p className="document-subtitle">{copy.landing.documentSubtitle}</p>

                <div className="document-line" style={{ width: "74%" }} />
                <div className="document-line" style={{ width: "48%" }} />

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
          </div>
        </section>

        <section id="features" className="feature-strip">
          {copy.landing.features.map((feature, index) => (
            <article key={feature.id} className={`feature-card motion-slide-up motion-delay-${index + 1}`}>
              <p>{feature.id}</p>
              <h3>{feature.title}</h3>
              <p className="muted-copy">{feature.body}</p>
            </article>
          ))}
        </section>

        <section id="gallery" className="gallery-section">
          <div className="gallery-header motion-slide-up">
            <div>
              <span className="section-kicker">{copy.landing.galleryKicker}</span>
              <h2>{copy.landing.galleryTitle}</h2>
            </div>
            <p className="muted-copy gallery-lead">{copy.landing.galleryLead}</p>
          </div>

          <div className="gallery-grid">
            {copy.landing.gallery.map((item, index) => (
              <article key={item.title} className={`gallery-card motion-slide-up motion-delay-${index + 1}`}>
                <div className={galleryStageClassNames[index]} />
                <p>{item.id}</p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-banner motion-slide-up motion-delay-2">
          <div>
            <span className="section-kicker">{copy.landing.cta.kicker}</span>
            <h2>{copy.landing.cta.title}</h2>
            <p>{copy.landing.cta.body}</p>
          </div>

          <div className="button-row">
            <HoverActionButton href="/sign-in">
              {copy.landing.cta.primary}
            </HoverActionButton>
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
    </div>
  );
}
