import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import {
  APP_LOCALE_COOKIE_NAME,
  APP_LOCALE_STORAGE_KEY,
  appCopy,
  isAppLocale,
  type AppLocale,
} from "@/lib/app/content";
import "./globals.css";

const storedLocaleBootScript = `(function(){try{var stored=localStorage.getItem(${JSON.stringify(APP_LOCALE_STORAGE_KEY)});if(stored==="en"||stored==="ar"){document.documentElement.lang=stored;document.documentElement.dir=stored==="ar"?"rtl":"ltr";}}catch(e){}})();`;

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
  const validCookieLocale = isAppLocale(cookieLocale) ? cookieLocale : null;
  const initialLocale: AppLocale = validCookieLocale ?? "en";
  const initialDirection = appCopy[initialLocale].meta.dir;
  const allowStoredLocaleOverride = validCookieLocale === null;

  return (
    <html lang={initialLocale} dir={initialDirection} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body data-locale={initialLocale}>
        {allowStoredLocaleOverride ? (
          <script id="ofuqi-locale-boot" dangerouslySetInnerHTML={{ __html: storedLocaleBootScript }} />
        ) : null}
        <ConvexAuthNextjsServerProvider>
          <ConvexClientProvider initialLocale={initialLocale} allowStoredLocaleOverride={allowStoredLocaleOverride}>
            {children}
            <Analytics />
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
