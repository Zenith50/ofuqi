"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import LocaleToggle from "@/components/ui/LocaleToggle";
import HoverActionButton from "@/components/ui/HoverActionButton";
import Reveal, { RevealItem } from "@/components/ui/Reveal";
import SegmentedControl from "@/components/ui/SegmentedControl";
import TextShimmer from "@/components/ui/TextShimmer";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";

function getAuthErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function SignInPage() {
  const router = useRouter();
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await signIn("password", {
        email,
        password,
        flow: step,
        redirectTo: "/dashboard",
      });

      if (result.signingIn) {
        router.replace("/dashboard");
      }
    } catch (authError: unknown) {
      const message = getAuthErrorMessage(authError);

      if (message.includes("already exists")) {
        setError(copy.auth.errors.exists);
      } else if (message.includes("fetch failed")) {
        setError(copy.auth.errors.backendOffline);
      } else if (
        message.includes("InvalidAccountId") ||
        message.includes("CodeError") ||
        message.includes("Invalid credentials")
      ) {
        setError(copy.auth.errors.invalid);
      } else {
        setError(`${copy.auth.errors.failedPrefix} ${message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = step === "signIn" ? copy.auth.form.signInTitle : copy.auth.form.signUpTitle;
  const subtitle = step === "signIn" ? copy.auth.form.signInSubtitle : copy.auth.form.signUpSubtitle;

  return (
    <div className="auth-shell motion-page-enter">
      <section className="auth-visual">
        <div className="auth-visual-top">
          <div className="auth-visual-toolbar">
            <span className="section-kicker">
              <TextShimmer>{copy.auth.kicker}</TextShimmer>
            </span>
            <LocaleToggle compact />
          </div>

          <Reveal className="auth-visual-copy" when="mount">
            <h1>
              <span>{copy.auth.titleStart}</span>
              <span>{copy.auth.titleEnd}</span>
            </h1>
            <p>{copy.auth.lead}</p>
          </Reveal>

          <Reveal className="auth-metrics" stagger when="mount">
            {copy.auth.metrics.map((metric) => (
              <RevealItem key={metric.label} className="auth-metric">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </RevealItem>
            ))}
          </Reveal>
        </div>

        <Reveal className="auth-feature-list" stagger when="mount">
          {copy.auth.features.map((feature) => (
            <RevealItem key={feature.id}>
              <article className="auth-feature">
                <p>{feature.id}</p>
                <h3>{feature.title}</h3>
                <p className="muted-copy">{feature.body}</p>
              </article>
            </RevealItem>
          ))}
        </Reveal>
      </section>

      <section className="auth-card glass-panel">
        <header className="auth-card-header">
          <SegmentedControl
            ariaLabel={copy.auth.kicker}
            value={step}
            onChange={(nextStep) => {
              setStep(nextStep);
              setError(null);
            }}
            options={[
              { value: "signIn", label: copy.auth.tabs.signIn },
              { value: "signUp", label: copy.auth.tabs.signUp },
            ]}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="auth-title">{title}</h2>
              <p className="auth-subtitle">{subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-error">{error}</div> : null}

          <div className="field">
            <label htmlFor="email">{copy.auth.form.emailLabel}</label>
            <div className="input-shell">
              <input
                id="email"
                type="email"
                placeholder={copy.auth.form.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">{copy.auth.form.passwordLabel}</label>
            <div className="input-shell">
              <input
                id="password"
                type="password"
                placeholder={copy.auth.form.passwordPlaceholder}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={step === "signIn" ? "current-password" : "new-password"}
                required
              />
            </div>
          </div>

          <HoverActionButton type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting
              ? step === "signIn"
                ? copy.auth.form.signingIn
                : copy.auth.form.signingUp
              : step === "signIn"
                ? copy.auth.form.signInAction
                : copy.auth.form.signUpAction}
          </HoverActionButton>
        </form>

        <div className="auth-footer">
          <span>
            {step === "signIn" ? copy.auth.footer.needAccount : copy.auth.footer.haveAccount}{" "}
            <button
              type="button"
              className="text-link"
              onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
            >
              {step === "signIn" ? copy.auth.footer.switchToSignUp : copy.auth.footer.switchToSignIn}
            </button>
          </span>

          <Link href="/" className="text-link">
            {copy.common.backToLanding}
          </Link>
        </div>
      </section>
    </div>
  );
}
