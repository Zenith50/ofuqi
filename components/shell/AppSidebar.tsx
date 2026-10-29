"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, FileText, LayoutTemplate, Plus, Settings2, ShieldCheck, X } from "lucide-react";
import AccountMenu from "@/components/shell/AccountMenu";
import BrandLockup from "@/components/shell/BrandLockup";
import { useDialogLifecycle } from "@/components/shell/useDialog";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import DeskSlip from "@/components/ui/DeskSlip";
import { getCopy } from "@/lib/app/content";
import { drawerEase, motionEase } from "@/lib/ui/motion";

const navHrefs = ["/dashboard", "/dashboard/templates", "/dashboard/performance", "/dashboard/settings"] as const;

function studioPlace(pathname: string, copy: ReturnType<typeof getCopy>) {
  if (pathname.startsWith("/chat")) {
    return copy.chat.headerTitle;
  }

  if (pathname.startsWith("/dashboard/templates")) {
    return copy.dashboard.nav.templates;
  }

  if (pathname.startsWith("/dashboard/performance")) {
    return copy.dashboard.nav.readiness;
  }

  if (pathname.startsWith("/dashboard/settings")) {
    return copy.dashboard.nav.settings;
  }

  return copy.dashboard.nav.library;
}

export default function AppSidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onCloseMobile,
  email,
  onSignOut,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
  email: string;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const { dir, locale } = useAppLocale();
  const copy = getCopy(locale);
  const drawerRef = useRef<HTMLElement>(null);
  const place = studioPlace(pathname, copy);
  const closedDrawer = dir === "rtl" ? "translateX(100%)" : "translateX(-100%)";

  useDialogLifecycle(mobileOpen, drawerRef, onCloseMobile);

  const icons = [FileText, LayoutTemplate, ShieldCheck, Settings2];
  const labels = [
    copy.dashboard.nav.library,
    copy.dashboard.nav.templates,
    copy.dashboard.nav.readiness,
    copy.dashboard.nav.settings,
  ];

  const renderNav = (expanded: boolean) => (
    <nav className="app-nav" aria-label={copy.dashboard.navLabel}>
      {navHrefs.map((href, index) => {
        const active = href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        const Icon = icons[index] ?? FileText;
        const label = labels[index] ?? href;

        return (
          <Link
            key={href}
            href={href}
            className={active ? "app-nav-link active" : "app-nav-link"}
            aria-current={active ? "page" : undefined}
            aria-label={expanded ? undefined : label}
            onClick={onCloseMobile}
          >
            <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
            {expanded ? <span className="app-nav-label">{label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );

  const renderCreate = (expanded: boolean) => expanded ? (
    <Link href="/chat/new" className="button-primary app-create" onClick={onCloseMobile}>
      {copy.dashboard.primaryAction}
    </Link>
  ) : (
    <Link href="/chat/new" className="app-icon-button" aria-label={copy.dashboard.primaryAction} onClick={onCloseMobile}>
      <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
    </Link>
  );

  return (
    <>
      <aside className={collapsed ? "app-sidebar app-sidebar--collapsed" : "app-sidebar"} data-collapsed={collapsed ? "true" : "false"}>
        <div className="app-sidebar-top">
          {collapsed ? (
            <Link href="/dashboard" className="brand-lockup brand-lockup--mark" aria-label={copy.common.brandTitle}>
              <span className="brand-mark">{copy.common.brandMark}</span>
            </Link>
          ) : (
            <BrandLockup href="/dashboard" />
          )}
          <button
            type="button"
            className="app-icon-button app-sidebar-toggle"
            onClick={onToggle}
            aria-label={collapsed ? copy.dashboard.sidebarExpand : copy.dashboard.sidebarCollapse}
          >
            {collapsed ? <ChevronsRight size={16} strokeWidth={1.5} aria-hidden="true" /> : <ChevronsLeft size={16} strokeWidth={1.5} aria-hidden="true" />}
          </button>
        </div>
        {collapsed ? null : <DeskSlip label={copy.dashboard.navLabel} detail={place} />}
        {renderCreate(!collapsed)}
        {renderNav(!collapsed)}
        <AccountMenu key={collapsed ? "collapsed" : "open"} email={email} collapsed={collapsed} onSignOut={onSignOut} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div key="app-drawer" className="app-drawer-root">
            <motion.button
              type="button"
              className="app-drawer-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: motionEase }}
              onClick={onCloseMobile}
              aria-label={copy.common.closeMenu}
            />
            <motion.aside
              id="app-drawer"
              ref={drawerRef}
              className="app-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={copy.dashboard.navLabel}
              initial={reduced ? false : { transform: closedDrawer }}
              animate={reduced ? { opacity: 1 } : { transform: "translateX(0%)" }}
              exit={
                reduced
                  ? { opacity: 0, transition: { duration: 0.16, ease: motionEase } }
                  : { transform: closedDrawer, transition: { duration: 0.22, ease: motionEase } }
              }
              transition={{ duration: 0.42, ease: drawerEase }}
            >
              <div className="app-drawer-head">
                <BrandLockup href="/dashboard" subtitle={false} />
                <button type="button" className="app-icon-button" onClick={onCloseMobile} aria-label={copy.common.closeMenu}>
                  <X size={16} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
              <DeskSlip label={copy.dashboard.navLabel} detail={place} />
              {renderCreate(true)}
              {renderNav(true)}
              <AccountMenu email={email} collapsed={false} onSignOut={onSignOut} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
