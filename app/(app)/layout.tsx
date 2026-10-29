import { cookies } from "next/headers";
import AppShell from "@/components/shell/AppShell";
import { SIDEBAR_STORAGE_KEY } from "@/lib/ui/sidebarPreference";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get(SIDEBAR_STORAGE_KEY)?.value === "true";

  return <AppShell initialCollapsed={initialCollapsed}>{children}</AppShell>;
}
