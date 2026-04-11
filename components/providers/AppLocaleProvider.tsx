"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  APP_LOCALE_COOKIE_NAME,
  APP_LOCALE_STORAGE_KEY,
  appCopy,
  isAppLocale,
  type AppLocale,
} from "@/lib/app/content";

type AppLocaleContextValue = {
  locale: AppLocale;
  dir: "ltr" | "rtl";
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
};

const AppLocaleContext = createContext<AppLocaleContextValue | null>(null);

export function AppLocaleProvider({
  children,
  initialLocale = "en",
  allowStoredLocaleOverride = true,
}: {
  children: ReactNode;
  initialLocale?: AppLocale;
  allowStoredLocaleOverride?: boolean;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    if (!allowStoredLocaleOverride || typeof window === "undefined") {
      return initialLocale;
    }

    try {
      const storedLocale = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
      return isAppLocale(storedLocale) ? storedLocale : initialLocale;
    } catch {
      return initialLocale;
    }
  });

  useEffect(() => {
    const direction = appCopy[locale].meta.dir;

    document.documentElement.lang = locale;
    document.documentElement.dir = direction;

    if (document.body) {
      document.body.dataset.locale = locale;
    }

    try {
      window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
    } catch {
      // Ignore storage access issues.
    }

    document.cookie = `${APP_LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  const value = useMemo<AppLocaleContextValue>(
    () => ({
      locale,
      dir: appCopy[locale].meta.dir,
      setLocale: setLocaleState,
      toggleLocale: () => setLocaleState((current) => (current === "en" ? "ar" : "en")),
    }),
    [locale],
  );

  return <AppLocaleContext.Provider value={value}>{children}</AppLocaleContext.Provider>;
}

export function useAppLocale() {
  const context = useContext(AppLocaleContext);

  if (context === null) {
    throw new Error("useAppLocale must be used inside AppLocaleProvider");
  }

  return context;
}
