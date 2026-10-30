"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motionEase } from "@/lib/ui/motion";

export default function RouteEnter({
  children,
  mode = "page",
}: {
  children: ReactNode;
  mode?: "page" | "landing";
}) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const landing = mode === "landing";
  const chat = pathname.startsWith("/chat");
  const className = landing ? "site-shell" : "route-enter";

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      className={className}
      initial={landing || chat ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={landing || chat ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{
        duration: landing ? 0.32 : chat ? 0.2 : 0.24,
        ease: motionEase,
      }}
    >
      {children}
    </motion.div>
  );
}
