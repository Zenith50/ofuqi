"use client";

import { Menu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import LocaleToggle from "@/components/ui/LocaleToggle";
import { getCopy } from "@/lib/app/content";
import { motionEase } from "@/lib/ui/motion";

export default function AppTopbar({
  menuOpen,
  onOpenMenu,
}: {
  menuOpen: boolean;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
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
  const kicker = pathname.startsWith("/chat")
    ? copy.chat.workspaceKicker
    : pathname.startsWith("/dashboard/templates")
      ? copy.templates.headingLabel
      : pathname.startsWith("/dashboard/performance")
        ? copy.performance.headingLabel
        : pathname.startsWith("/dashboard/settings")
          ? copy.settings.headingLabel
          : copy.dashboard.headingLabel;
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
      <div className="app-topbar-copy">
        <p className="instrument-kicker">{kicker}</p>
        <motion.p
          key={title}
          className="app-topbar-title"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: motionEase }}
        >
          {title}
        </motion.p>
      </div>
      <div className="app-topbar-tools">
        {showLocale ? <LocaleToggle compact /> : null}
      </div>
    </header>
  );
}
