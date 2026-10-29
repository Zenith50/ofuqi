"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useSyncExternalStore, type CSSProperties } from "react";

type TextShimmerProps = {
  children: string;
  className?: string;
  duration?: number;
  spread?: number;
};

function subscribeToHydration() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export default function TextShimmer({
  children,
  className,
  duration = 2.4,
  spread = 3,
}: TextShimmerProps) {
  const prefersReducedMotion = useReducedMotion();
  // The media preference is unavailable during SSR. Stay on static text until the client snapshot says motion is allowed.
  const isClient = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);

  if (!isClient || prefersReducedMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      className={["text-shimmer", className].filter(Boolean).join(" ")}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{ repeat: Infinity, duration, ease: "linear" }}
      style={
        {
          "--text-shimmer-spread": `${Math.max(children.length * spread, 56)}px`,
        } as CSSProperties
      }
    >
      {children}
    </motion.span>
  );
}
