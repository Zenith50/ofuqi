import Link from "next/link";
import { cookies } from "next/headers";
import { APP_LOCALE_COOKIE_NAME, getCopy, isAppLocale } from "@/lib/app/content";

export default async function NotFound() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(APP_LOCALE_COOKIE_NAME)?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : "en";
  const copy = getCopy(locale);

  return (
    <main id="main" className="status-page">
      <h1>{copy.common.notFoundTitle}</h1>
      <p>{copy.common.notFoundBody}</p>
      <Link href="/" className="button-primary">
        {copy.common.notFoundAction}
      </Link>
    </main>
  );
}
