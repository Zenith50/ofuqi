"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import LocaleToggle from "@/components/ui/LocaleToggle";
import { getCopy } from "@/lib/app/content";

export default function AppTopbar({
  menuOpen,
  onOpenMenu,
}: {
  menuOpen: boolean;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const title = pathname.startsWith("/chat")
    ? copy.chat.headerTitle
    : pathname.startsWith("/dashboard/templates")
      ? copy.dashboard.nav.templates
      : pathname.startsWith("/dashboard/performance")
        ? copy.dashboard.nav.readiness
        : pathname.startsWith("/dashboard/settings")
          ? copy.dashboard.nav.settings
          : copy.dashboard.nav.library;
  const showLocale = !pathname.startsWith("/dashboard/settings");

  return (
    <header className="app-topbar">
      <button
        type="button"
        className="app-icon-button app-menu-button"
        aria-label={copy.common.openMenu}
        aria-expanded={menuOpen}
        aria-controls="app-drawer"
        onClick={onOpenMenu}
      >
        <Menu size={16} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <p key={title} className="app-topbar-title settle-fade">
        {title}
      </p>
      <div className="app-topbar-tools">
        {showLocale ? <LocaleToggle compact /> : null}
      </div>
    </header>
  );
}
