"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutTemplate,
  Menu,
  Plus,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import LocaleToggle from "@/components/ui/LocaleToggle";
import HoverActionButton from "@/components/ui/HoverActionButton";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";

const desktopSidebarMotion = {
  expanded: { width: 272 },
  collapsed: { width: 84 },
};

const SIDEBAR_STORAGE_KEY = "ofuqi-dashboard-sidebar-collapsed";
const LEGACY_SIDEBAR_STORAGE_KEY = "oc-cv-maker-dashboard-sidebar-collapsed";
const SIDEBAR_STORAGE_EVENT = "ofuqi:sidebar-collapsed-change";

function readDesktopSidebarCollapsedPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const persistedValue =
      window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
      ?? window.localStorage.getItem(LEGACY_SIDEBAR_STORAGE_KEY);

    return persistedValue === "true";
  } catch {
    return false;
  }
}

function subscribeToDesktopSidebarPreference(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === SIDEBAR_STORAGE_KEY || event.key === LEGACY_SIDEBAR_STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleCustomChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SIDEBAR_STORAGE_EVENT, handleCustomChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SIDEBAR_STORAGE_EVENT, handleCustomChange);
  };
}

function writeDesktopSidebarCollapsedPreference(nextValue: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
  } catch {
    // Ignore storage access issues and keep the current interaction in-memory.
  }

  window.dispatchEvent(new Event(SIDEBAR_STORAGE_EVENT));
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useQuery(api.users.current);
  const { signOut } = useAuthActions();
  const { locale } = useAppLocale();
  const copy = getCopy(locale);

  const desktopSidebarCollapsed = useSyncExternalStore(
    subscribeToDesktopSidebarPreference,
    readDesktopSidebarCollapsedPreference,
    () => false,
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { href: "/dashboard", label: copy.dashboard.nav.library, icon: FileText },
      { href: "/dashboard/templates", label: copy.dashboard.nav.templates, icon: LayoutTemplate },
      { href: "/dashboard/performance", label: copy.dashboard.nav.readiness, icon: ShieldCheck },
      { href: "/dashboard/settings", label: copy.dashboard.nav.settings, icon: Settings2 },
    ],
    [copy],
  );

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "OF";
  const activePageTitle = pathname === "/dashboard"
    ? copy.dashboard.nav.library
    : pathname.startsWith("/dashboard/templates")
      ? copy.dashboard.nav.templates
      : pathname.startsWith("/dashboard/performance")
        ? copy.dashboard.nav.readiness
        : copy.dashboard.nav.settings;
  const isDesktopSidebarExpanded = !desktopSidebarCollapsed;
  const CollapseIcon = locale === "ar" ? ChevronsRight : ChevronsLeft;
  const ExpandIcon = locale === "ar" ? ChevronsLeft : ChevronsRight;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  const renderSidebarBody = (expanded: boolean, showDesktopToggle: boolean) => (
    <>
      <div className={`library-sidebar-top ${expanded ? "" : "library-sidebar-top--collapsed"}`.trim()}>
        <div className={`library-sidebar-toolbar ${expanded ? "" : "library-sidebar-toolbar--collapsed"}`.trim()}>
          <Link href="/dashboard" className="library-brand">
            <span className="library-brand-mark">{copy.common.brandMark}</span>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  key="brand-copy"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="library-brand-copy"
                >
                  <strong>{copy.common.brandTitle}</strong>
                  <span>{copy.common.brandSubtitle}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Link>

          {showDesktopToggle ? (
            <button
              type="button"
              className="library-icon-button library-sidebar-toggle"
              onClick={() => writeDesktopSidebarCollapsedPreference(!desktopSidebarCollapsed)}
              aria-label={expanded ? copy.dashboard.sidebarCollapse : copy.dashboard.sidebarExpand}
            >
              {expanded ? <CollapseIcon size={18} /> : <ExpandIcon size={18} />}
            </button>
          ) : null}
        </div>

        <div className={`library-sidebar-cta ${expanded ? "" : "library-sidebar-cta--collapsed"}`.trim()}>
          {expanded ? (
            <HoverActionButton href="/chat/new" className="library-create-button">
              {copy.dashboard.primaryAction}
            </HoverActionButton>
          ) : (
            <Link href="/chat/new" className="library-icon-button" aria-label={copy.dashboard.primaryAction}>
              <Plus size={18} />
            </Link>
          )}
        </div>
      </div>

      <nav className={`library-nav ${expanded ? "" : "library-nav--collapsed"}`.trim()} aria-label={copy.dashboard.sectionLabel}>
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`library-nav-link ${isActive ? "active" : ""}`.trim()}
              onClick={() => setMobileSidebarOpen(false)}
              aria-label={item.label}
            >
              <span className="library-nav-icon">
                <Icon size={18} />
              </span>
              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.span
                    key={`${item.href}-label`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="library-nav-label"
                  >
                    {item.label}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className={`library-sidebar-footer ${expanded ? "" : "library-sidebar-footer--collapsed"}`.trim()}>
        <div className={`library-account-card ${expanded ? "" : "library-account-card--collapsed"}`.trim()}>
          <div className="library-account-head">
            <span className="library-account-avatar" aria-hidden="true">
              {initials}
            </span>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  key="account-copy"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="library-account-copy"
                >
                  <strong>{user?.email ?? copy.dashboard.accountLabel}</strong>
                  <p>{copy.dashboard.accountLabel}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="library-shell motion-page-enter">
      <motion.aside
        className="library-sidebar library-sidebar--desktop"
        data-collapsed={desktopSidebarCollapsed ? "true" : "false"}
        initial={false}
        animate={isDesktopSidebarExpanded ? "expanded" : "collapsed"}
        variants={desktopSidebarMotion}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {renderSidebarBody(isDesktopSidebarExpanded, true)}
      </motion.aside>

      <AnimatePresence>
        {mobileSidebarOpen ? (
          <>
            <motion.button
              type="button"
              className="library-sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              aria-label={copy.common.backToDashboard}
            />

            <motion.aside
              className="library-sidebar library-sidebar--mobile"
              data-collapsed="false"
              initial={{ x: locale === "ar" ? 380 : -380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: locale === "ar" ? 380 : -380, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="library-mobile-topbar">
                <span className="section-kicker">{copy.dashboard.sectionLabel}</span>
                <button
                  type="button"
                  className="library-icon-button"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label={copy.common.backToDashboard}
              >
                <X size={18} />
              </button>
            </div>
              {renderSidebarBody(true, false)}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="library-main">
        <header className="library-topbar motion-slide-up motion-delay-1">
          <div className="library-topbar-left">
            <button
              type="button"
              className="library-icon-button library-mobile-trigger"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label={copy.dashboard.sectionLabel}
            >
              <Menu size={18} />
            </button>

          <div className="library-topbar-copy">
              <span className="section-kicker">{copy.common.brandTitle}</span>
              <p>{activePageTitle}</p>
            </div>
          </div>

          <div className="library-topbar-right">
            <LocaleToggle compact />

            <div className="library-profile-pill">
              <span className="library-account-avatar" aria-hidden="true">
                {initials}
              </span>
              <div className="library-profile-copy">
                <strong>{user?.email ?? copy.dashboard.accountLabel}</strong>
                <span>{copy.common.emailPasswordAccess}</span>
              </div>
            </div>

            <button type="button" className="button-secondary library-signout-button" onClick={() => void handleSignOut()}>
              {copy.common.signOut}
            </button>
          </div>
        </header>

        <main className="library-main-content">{children}</main>
      </div>
    </div>
  );
}
