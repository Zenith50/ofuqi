"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ReactNode } from "react";
import { AppLocaleProvider } from "@/components/providers/AppLocaleProvider";
import type { AppLocale } from "@/lib/app/content";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({
  children,
  initialLocale,
  allowStoredLocaleOverride,
}: {
  children: ReactNode;
  initialLocale: AppLocale;
  allowStoredLocaleOverride: boolean;
}) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      <AppLocaleProvider initialLocale={initialLocale} allowStoredLocaleOverride={allowStoredLocaleOverride}>
        {children}
      </AppLocaleProvider>
    </ConvexAuthNextjsProvider>
  );
}
