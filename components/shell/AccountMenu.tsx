"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAppLocale } from "@/components/providers/AppLocaleProvider";
import { getCopy } from "@/lib/app/content";

export default function AccountMenu({
  email,
  collapsed,
  onSignOut,
}: {
  email: string;
  collapsed: boolean;
  onSignOut: () => void;
}) {
  const { locale } = useAppLocale();
  const copy = getCopy(locale);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const label = email || copy.dashboard.accountLabel;
  const initials = email.slice(0, 2).toUpperCase() || copy.common.brandMark;

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!collapsed) {
    return (
      <div className="account-panel">
        <div className="account-identity">
          <p className="account-email">{label}</p>
          <p className="account-status">{copy.dashboard.accountStatus}</p>
        </div>
        <button type="button" className="button-secondary account-signout" onClick={onSignOut}>
          {copy.common.signOut}
        </button>
      </div>
    );
  }

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="app-icon-button"
        aria-label={copy.common.accountMenu}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">{initials}</span>
      </button>
      {open ? (
        <div className="account-menu-panel" role="menu">
          <p className="account-email">{label}</p>
          <Link
            href="/dashboard/settings"
            role="menuitem"
            className="account-menu-item"
            onClick={() => setOpen(false)}
          >
            {copy.dashboard.sidebarSecondaryAction}
          </Link>
          <button type="button" role="menuitem" className="account-menu-item" onClick={onSignOut}>
            {copy.common.signOut}
          </button>
        </div>
      ) : null}
    </div>
  );
}
