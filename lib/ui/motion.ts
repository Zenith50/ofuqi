import type { Transition, Variants } from "framer-motion";

export const motionEase = [0.23, 1, 0.32, 1] as const;

export const motionEaseInOut = [0.77, 0, 0.175, 1] as const;

export const motionEaseDrawer = [0.32, 0.72, 0, 1] as const;

export const productTransition: Transition = {
  duration: 0.24,
  ease: motionEase,
};

export const riseTransition: Transition = {
  duration: 0.24,
  ease: motionEase,
};

export const pillTransition: Transition = {
  duration: 0.2,
  ease: motionEaseInOut,
};

export const drawerTransition: Transition = {
  duration: 0.28,
  ease: motionEaseDrawer,
};

export const drawerExitTransition: Transition = {
  duration: 0.16,
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
