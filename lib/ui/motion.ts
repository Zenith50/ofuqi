import type { Transition, Variants } from "framer-motion";

export const motionEase = [0.22, 1, 0.36, 1] as const;

/** Spring from the 21st.dev magnetic button, kept snappy but used at a lower pull strength. */
export const magneticSpring = {
  stiffness: 200,
  damping: 15,
  mass: 0.1,
};

export const riseTransition: Transition = {
  duration: 0.5,
  ease: motionEase,
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.08,
    },
  },
};

export const riseItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: riseTransition,
  },
};
