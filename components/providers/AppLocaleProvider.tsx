"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
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
const LOCALE_STORAGE_EVENT = "ofuqi:locale-change";

function readStoredAppLocale(): AppLocale | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedLocale = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
    return isAppLocale(storedLocale) ? storedLocale : null;
  } catch {
    return null;
  }
}

function getServerStoredLocale(): AppLocale | null {
  return null;
}

function subscribeToStoredLocale(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === APP_LOCALE_STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleCustomChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LOCALE_STORAGE_EVENT, handleCustomChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LOCALE_STORAGE_EVENT, handleCustomChange);
  };
}

function writeStoredLocale(locale: AppLocale) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (window.localStorage.getItem(APP_LOCALE_STORAGE_KEY) !== locale) {
      window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
      window.dispatchEvent(new Event(LOCALE_STORAGE_EVENT));
    }
  } catch {
    // Ignore storage access issues.
  }

  document.cookie = `${APP_LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

function applyDocumentLocale(locale: AppLocale) {
  const direction = appCopy[locale].meta.dir;

  document.documentElement.lang = locale;
  document.documentElement.dir = direction;

  if (document.body) {
    document.body.dataset.locale = locale;
  }
}

function resolveLocale(
  initialLocale: AppLocale,
  allowStoredLocaleOverride: boolean,
  storedLocale: AppLocale | null,
  selectedLocale: AppLocale | null,
): AppLocale {
  if (selectedLocale) {
    return selectedLocale;
  }

  if (!allowStoredLocaleOverride) {
    return initialLocale;
  }

  return storedLocale ?? initialLocale;
}

export function AppLocaleProvider({
  children,
  initialLocale = "en",
  allowStoredLocaleOverride = true,
}: {
  children: ReactNode;
  initialLocale?: AppLocale;
  allowStoredLocaleOverride?: boolean;
}) {
  const storedLocale = useSyncExternalStore(
    subscribeToStoredLocale,
    readStoredAppLocale,
    getServerStoredLocale,
  );
  const [selectedLocale, setSelectedLocale] = useState<AppLocale | null>(null);
  const locale = resolveLocale(initialLocale, allowStoredLocaleOverride, storedLocale, selectedLocale);

  useLayoutEffect(() => {
    const stored = allowStoredLocaleOverride ? readStoredAppLocale() : null;
    const nextLocale = selectedLocale
      ?? (allowStoredLocaleOverride ? (stored ?? initialLocale) : initialLocale);

    applyDocumentLocale(nextLocale);
    // Persist the resolved locale, never the stale SSR fallback.
    writeStoredLocale(nextLocale);

    if (allowStoredLocaleOverride && selectedLocale === null && stored !== storedLocale) {
      window.dispatchEvent(new Event(LOCALE_STORAGE_EVENT));
    }
  }, [allowStoredLocaleOverride, initialLocale, selectedLocale, storedLocale]);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    applyDocumentLocale(nextLocale);
    writeStoredLocale(nextLocale);
    setSelectedLocale(nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "ar" : "en");
  }, [locale, setLocale]);

  const value = useMemo<AppLocaleContextValue>(
    () => ({
      locale,
      dir: appCopy[locale].meta.dir,
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale],
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
