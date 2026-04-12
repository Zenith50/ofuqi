import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import { APP_LOCALE_COOKIE_NAME, appCopy, isAppLocale, type AppLocale } from "@/lib/app/content";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ofuqi - Bilingual CV Workspace",
  description:
    "Create professional Arabic and English CVs with Ofuqi, a premium bilingual workspace with live preview, real export, and private access.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(APP_LOCALE_COOKIE_NAME)?.value;
  const hasLocaleCookie = isAppLocale(cookieLocale);
  const initialLocale: AppLocale = hasLocaleCookie ? cookieLocale : "en";
  const initialDirection = appCopy[initialLocale].meta.dir;

  return (
    <html lang={initialLocale} dir={initialDirection} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body data-locale={initialLocale}>
        <ConvexAuthNextjsServerProvider>
          <ConvexClientProvider initialLocale={initialLocale} allowStoredLocaleOverride={!hasLocaleCookie}>
            {children}
            <Analytics />
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
