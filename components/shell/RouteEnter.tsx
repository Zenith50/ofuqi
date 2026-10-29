import type { ReactNode } from "react";

export default function RouteEnter({
  children,
  mode = "page",
}: {
  children: ReactNode;
  mode?: "page" | "landing";
}) {
  return <div className={mode === "landing" ? "site-shell" : "route-enter"}>{children}</div>;
}
