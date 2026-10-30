"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import AppSidebar from "@/components/shell/AppSidebar";
import AppTopbar from "@/components/shell/AppTopbar";
import RouteEnter from "@/components/shell/RouteEnter";
import { api } from "@/convex/_generated/api";
import { persistSidebarCollapsed } from "@/lib/ui/sidebarPreference";

export default function AppShell({
  children,
  initialCollapsed,
}: {
  children: React.ReactNode;
  initialCollapsed: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useQuery(api.users.current);
  const { signOut } = useAuthActions();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const mobileOpen = mobileOpenPath === pathname;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  return (
    <div className={collapsed ? "app-shell app-shell--collapsed" : "app-shell"}>
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => {
          setCollapsed((current) => {
            const next = !current;
            persistSidebarCollapsed(next);
            return next;
          });
        }}
        onCloseMobile={() => setMobileOpenPath(null)}
        email={user?.email ?? ""}
        onSignOut={() => void handleSignOut()}
      />
      <div className="app-main">
        <AppTopbar menuOpen={mobileOpen} onOpenMenu={() => setMobileOpenPath(pathname)} />
        <main id="main" className="app-main-content">
          <RouteEnter>{children}</RouteEnter>
        </main>
      </div>
    </div>
  );
}
