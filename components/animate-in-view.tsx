"use client";

import {
  motion,
  useReducedMotion,
  type TargetAndTransition,
} from "motion/react";
import type { ReactNode } from "react";

type AnimationVariant = "fade-up" | "fade-left" | "fade-right" | "scale";

const variants: Record<
  AnimationVariant,
  { initial: TargetAndTransition; whileInView: TargetAndTransition }
> = {
  "fade-up": {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
  },
  "fade-left": {
    initial: { opacity: 0, x: -24 },
    whileInView: { opacity: 1, x: 0 },
  },
  "fade-right": {
    initial: { opacity: 0, x: 24 },
    whileInView: { opacity: 1, x: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    whileInView: { opacity: 1, scale: 1 },
  },
};

export function AnimateInView({
  children,
  variant = "fade-up",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const v = variants[variant];

  // Always render the same motion.div: the server HTML carries the hidden
  // initial style, and swapping to a plain <div> for reduced motion caused a
  // hydration mismatch React does not patch, leaving the content invisible.
  // Reduced motion gets an instant transition instead.
  return (
    <motion.div
      className={className}
      initial={v.initial}
      whileInView={v.whileInView}
      viewport={{ once: true, margin: "-80px" }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              duration: 0.55,
              delay,
              ease: [0.21, 0.47, 0.32, 0.98],
            }
      }
    >
      {children}
    </motion.div>
  );
}
