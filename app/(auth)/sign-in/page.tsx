"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import LocaleToggle from "@/components/ui/LocaleToggle";
import HoverActionButton from "@/components/ui/HoverActionButton";
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
      <section className="auth-visual motion-slide-up">
        <div className="auth-visual-top">
          <div className="auth-visual-toolbar">
            <span className="section-kicker">
              <TextShimmer>{copy.auth.kicker}</TextShimmer>
            </span>
            <LocaleToggle compact />
          </div>

          <div className="auth-visual-copy">
            <h1>
              <span>{copy.auth.titleStart}</span>
              <span>{copy.auth.titleEnd}</span>
            </h1>
            <p>{copy.auth.lead}</p>
          </div>

          <div className="auth-metrics">
            {copy.auth.metrics.map((metric, index) => (
              <div key={metric.label} className={`auth-metric motion-slide-up motion-delay-${index + 1}`}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-feature-list">
          {copy.auth.features.map((feature, index) => (
            <article key={feature.id} className={`auth-feature motion-slide-up motion-delay-${index + 1}`}>
              <p>{feature.id}</p>
              <h3>{feature.title}</h3>
              <p className="muted-copy">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="auth-card glass-panel motion-slide-up motion-delay-2">
        <header className="auth-card-header">
          <div className="auth-toggle" role="tablist" aria-label={copy.auth.kicker}>
            <button
              type="button"
              className={step === "signIn" ? "active" : undefined}
              onClick={() => setStep("signIn")}
            >
              {copy.auth.tabs.signIn}
            </button>
            <button
              type="button"
              className={step === "signUp" ? "active" : undefined}
              onClick={() => setStep("signUp")}
            >
              {copy.auth.tabs.signUp}
            </button>
          </div>

          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
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
