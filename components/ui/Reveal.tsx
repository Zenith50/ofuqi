"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { productTransition, riseItem, staggerContainer } from "@/lib/ui/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
};

export default function Reveal({
  children,
  className,
  delay = 0,
  stagger = false,
}: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={
        stagger
          ? staggerContainer
          : {
              hidden: { opacity: 0, transform: "translateY(-8px)" },
              visible: {
                opacity: 1,
                transform: "translateY(0)",
                transition: { ...productTransition, delay },
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
