"use client";

import { motion, useReducedMotion, useSpring } from "framer-motion";
import type { ReactNode } from "react";
import { magneticSpring } from "@/lib/ui/motion";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
  disabled?: boolean;
};

export default function Magnetic({
  children,
  className,
  strength = 0.22,
  disabled = false,
}: MagneticProps) {
  const reduced = useReducedMotion();
  const x = useSpring(0, magneticSpring);
  const y = useSpring(0, magneticSpring);

  const onPointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (reduced || disabled) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      className={["magnetic", className].filter(Boolean).join(" ")}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      style={{ x, y }}
    >
      {children}
    </motion.span>
  );
}
