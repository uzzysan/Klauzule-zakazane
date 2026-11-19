"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Motion helpers. FairPact uses motion only to orient (content arriving),
 * never to decorate: no infinite loops, no bouncing, no rotation.
 */

const EASE_CALM = [0.22, 1, 0.36, 1] as const;

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
  color?: string;
  /** @deprecated ignored — icons are static. */
  animation?: string;
  /** @deprecated ignored. */
  hoverScale?: number;
  /** @deprecated ignored. */
  hoverRotate?: number;
}

/** Static icon wrapper, kept for API compatibility. */
export function AnimatedIcon({ icon: Icon, className, size = 24, color }: AnimatedIconProps) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)}>
      <Icon size={size} className={color} aria-hidden />
    </span>
  );
}

interface IconContainerProps {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  size?: number;
  /** @deprecated ignored — icons are static. */
  animation?: string;
  /** @deprecated ignored. */
  glowColor?: string;
}

/** Icon on a soft tinted tile. */
export function IconContainer({
  icon: Icon,
  className,
  iconClassName,
  size = 20,
}: IconContainerProps) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary",
        className
      )}
    >
      <Icon size={size} strokeWidth={1.75} className={iconClassName} aria-hidden />
    </div>
  );
}

interface AnimatedBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedBadge({ children, className }: AnimatedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

/** Reveals children in sequence the first time the group scrolls into view. */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.06,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_CALM } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

/** Gentle fade + ≤12px travel, once, when the element scrolls into view. */
export function FadeIn({ children, className, delay = 0, direction = "up" }: FadeInProps) {
  const offsets = {
    up: { y: 12 },
    down: { y: -12 },
    left: { x: 12 },
    right: { x: -12 },
    none: {},
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: EASE_CALM }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
