import type { CSSProperties } from "react";
import type { Transition, Variants } from "framer-motion";

export const motionEase = [0.22, 1, 0.36, 1] as const;

/** Entrances use the existing --ease-out token. Product UI stays at 200ms; exits are shorter. */
export const settleTransition: Transition = {
  duration: 0.2,
  ease: motionEase,
};

export const settleExit: Transition = {
  duration: 0.14,
  ease: motionEase,
};

export function settleDelay(ms: number): CSSProperties {
  return { "--settle-delay": `${ms}ms` } as CSSProperties;
}

export const pressEase = [0.4, 0, 1, 1] as const;

export const productTransition: Transition = {
  duration: 0.24,
  ease: motionEase,
};

export const riseTransition: Transition = {
  duration: 0.24,
  ease: motionEase,
};

export const pillTransition: Transition = {
  duration: 0.18,
  ease: motionEase,
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.04,
    },
  },
};

export const riseItem: Variants = {
  hidden: { opacity: 0, transform: "translateY(-8px)" },
  visible: {
    opacity: 1,
    transform: "translateY(0)",
    transition: riseTransition,
  },
};
