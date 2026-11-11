"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

/** Varian anak — pakai langsung pada motion.create(Link) dsb. */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0.7, 0.2, 1] } },
};

/**
 * Grid/list yang anak-anaknya muncul berurutan saat masuk viewport (sekali).
 * Bungkus tiap anak dengan <StaggerItem>.
 */
export function Stagger(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      {...props}
    />
  );
}

export function StaggerItem(props: HTMLMotionProps<"div">) {
  return <motion.div variants={staggerItemVariants} {...props} />;
}
