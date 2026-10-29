"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { motionEase } from "@/lib/ui/motion";

export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: motionEase }}>
      {children}
    </MotionConfig>
  );
}
