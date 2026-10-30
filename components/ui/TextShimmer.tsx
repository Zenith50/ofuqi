"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, type CSSProperties } from "react";

type TextShimmerProps = {
  children: string;
  className?: string;
  duration?: number;
  spread?: number;
};

export default function TextShimmer({
  children,
  className,
  duration = 1.2,
  spread = 3,
}: TextShimmerProps) {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);
  const classNames = ["text-shimmer", reduced || done ? "text-shimmer--static" : "", className].filter(Boolean).join(" ");

  if (reduced || done) {
    return <span className={classNames}>{children}</span>;
  }

  return (
    <motion.span
      className={classNames}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      onAnimationComplete={() => setDone(true)}
      transition={{ duration, ease: "linear", repeat: 0 }}
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
