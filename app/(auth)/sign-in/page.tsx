"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import SheetFrame from "@/components/cv/SheetFrame";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import HoverActionButton from "@/components/ui/HoverActionButton";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { getCopy } from "@/lib/app/content";
import { settleDelay } from "@/lib/ui/motion";

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError(copy.auth.errors.required);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await signIn("password", {
      email,
      password,
      flow: step,
      redirectTo: "/dashboard",
    }).catch((authError: unknown) => {
      const message = getAuthErrorMessage(authError);

      if (message.includes("already exists")) {
        setError(copy.auth.errors.exists);
      } else if (message.includes("fetch failed")) {
        setError(copy.auth.errors.backendOffline);
      } else if (
        message.includes("InvalidAccountId")
        || message.includes("CodeError")
        || message.includes("Invalid credentials")
      ) {
        setError(copy.auth.errors.invalid);
      } else {
        setError(`${copy.auth.errors.failedPrefix} ${message}`);
      }

      return null;
    });

    if (result?.signingIn) {
      router.replace("/dashboard");
    }

    setIsSubmitting(false);
  };

  const title = step === "signIn" ? copy.auth.form.signInTitle : copy.auth.form.signUpTitle;
  const subtitle = step === "signIn" ? copy.auth.form.signInSubtitle : copy.auth.form.signUpSubtitle;
  const pending = isLoading || isSubmitting;

  return (
    <div className="auth-shell">
      <section className="auth-card">
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
          <h1 className="auth-title settle-type">{title}</h1>
          <p className="auth-subtitle settle-ui" style={settleDelay(50)}>{subtitle}</p>
        </header>

        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)} noValidate aria-busy={pending}>
          {error ? (
            <div id="auth-error" className="auth-error settle-ui" role="alert">
              {error}
            </div>
          ) : null}

          <div className="field">
            <label className="settle-ui" htmlFor="email" style={settleDelay(90)}>{copy.auth.form.emailLabel}</label>
            <div className="input-shell">
              <input
                id="email"
                type="email"
                placeholder={copy.auth.form.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "auth-error" : undefined}
                disabled={pending}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="settle-ui" htmlFor="password" style={settleDelay(130)}>{copy.auth.form.passwordLabel}</label>
            <div className="input-shell">
              <input
                id="password"
                type="password"
                placeholder={copy.auth.form.passwordPlaceholder}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={step === "signIn" ? "current-password" : "new-password"}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "auth-error" : undefined}
                disabled={pending}
                required
              />
            </div>
          </div>

          <HoverActionButton type="submit" className="auth-submit" disabled={pending}>
            {pending
              ? isSubmitting
                ? step === "signIn"
                  ? copy.auth.form.signingIn
                  : copy.auth.form.signingUp
                : copy.common.loadingWorkspace
              : step === "signIn"
                ? copy.auth.form.signInAction
                : copy.auth.form.signUpAction}
          </HoverActionButton>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="text-link settle-ui"
            style={settleDelay(160)}
            onClick={() => {
              setStep(step === "signIn" ? "signUp" : "signIn");
              setError(null);
            }}
          >
            {step === "signIn" ? copy.auth.footer.switchToSignUp : copy.auth.footer.switchToSignIn}
          </button>
        </div>
      </section>

      <aside className="auth-story">
        <p className="section-kicker settle-ui" style={settleDelay(40)}>{copy.auth.kicker}</p>
        <p className="auth-story-title">
          <span className="settle-type" style={settleDelay(80)}>{copy.auth.titleStart}</span>{" "}
          <span className="settle-type" style={settleDelay(130)}>{copy.auth.titleEnd}</span>
        </p>
        <p className="muted-copy settle-ui" style={settleDelay(170)}>{copy.auth.lead}</p>
        <SheetFrame templateKey="harvard" sampleLocale={locale} className="sheet-frame--auth" />
      </aside>
    </div>
  );
}
