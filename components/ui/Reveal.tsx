"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { riseItem, riseTransition, staggerContainer } from "@/lib/ui/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
  when?: "view" | "mount";
};

export default function Reveal({
  children,
  className,
  delay = 0,
  stagger = false,
  when = "view",
}: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const playback = when === "mount"
    ? { animate: "visible" as const }
    : { whileInView: "visible" as const, viewport: { once: true, amount: 0.15 } };

  return (
    <motion.div
      className={className}
      initial="hidden"
      {...playback}
      variants={
        stagger
          ? staggerContainer
          : {
              hidden: { opacity: 0, y: 14 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { ...riseTransition, delay },
              },
            }
      }
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={riseItem}>
      {children}
    </motion.div>
  );
}
