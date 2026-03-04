"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
  animation?: "pulse" | "bounce" | "float" | "shake" | "spin" | "none";
  hoverScale?: number;
  hoverRotate?: number;
  color?: string;
}

const animations = {
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
  bounce: {
    y: [0, -6, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
  float: {
    y: [0, -4, 0],
    x: [0, 2, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
  shake: {
    x: [0, -2, 2, -2, 2, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 3,
    },
  },
  spin: {
    rotate: 360,
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "linear" as const,
    },
  },
  none: {},
};

export function AnimatedIcon({
  icon: Icon,
  className,
  size = 24,
  animation = "none",
  hoverScale = 1.1,
  hoverRotate = 0,
  color,
}: AnimatedIconProps) {
  return (
    <motion.div
      animate={animations[animation]}
      whileHover={{
        scale: hoverScale,
        rotate: hoverRotate,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.95 }}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <Icon size={size} className={color} />
    </motion.div>
  );
}

// Wrapper dla ikon w kontenerach (np. w tle)
interface IconContainerProps {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
  size?: number;
  animation?: "pulse" | "bounce" | "float" | "shake" | "spin" | "none";
  glowColor?: string;
}

export function IconContainer({
  icon: Icon,
  className,
  iconClassName,
  size = 24,
  animation = "pulse",
  glowColor,
}: IconContainerProps) {
  return (
    <motion.div
      className={cn(
        "flex items-center justify-center rounded-xl",
        className
      )}
      animate={animations[animation]}
      whileHover={{ scale: 1.05 }}
      style={glowColor ? { boxShadow: `0 0 20px ${glowColor}40` } : undefined}
    >
      <Icon size={size} className={iconClassName} />
    </motion.div>
  );
}

// Animated badge dla ikon (np. liczby powiadomień)
interface AnimatedBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedBadge({ children, className }: AnimatedBadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 15,
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold",
        className
      )}
    >
      {children}
    </motion.span>
  );
}

// Stagger container dla grup ikon
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Item dla stagger animation
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 12,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade in animation wrapper
interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: FadeInProps) {
  const directions = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
    none: {},
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
