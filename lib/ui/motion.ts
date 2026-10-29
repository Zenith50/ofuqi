import type { Transition, Variants } from "framer-motion";

export const motionEase = [0.22, 1, 0.36, 1] as const;

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
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: riseTransition,
  },
};
