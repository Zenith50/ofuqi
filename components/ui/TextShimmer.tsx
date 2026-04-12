"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";

type TextShimmerProps = {
  children: string;
  className?: string;
  duration?: number;
  spread?: number;
};

export default function TextShimmer({
  children,
  className,
  duration = 2.4,
  spread = 3,
}: TextShimmerProps) {
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
