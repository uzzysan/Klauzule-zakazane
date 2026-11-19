"use client";

import { motion } from "framer-motion";
import { Check, type LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

/*
 * Calm motion primitives. Rules (see docs/DESIGN_LANGUAGE.md → Motion):
 * no looping animation, no scale/rotate on hover, 120–280 ms, ease-out,
 * movement ≤ 12px. Framer Motion respects prefers-reduced-motion via
 * <MotionConfig reducedMotion="user"> in Providers.
 */

interface AnimatedButtonProps extends ButtonProps {
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
  /** @deprecated kept for API compatibility; glows are not part of the design language. */
  glowOnHover?: boolean;
}

/** Button with an optional icon that nudges 2px on hover (CSS only). */
export function AnimatedButton({
  icon: Icon,
  iconPosition = "right",
  children,
  className,
  glowOnHover: _glowOnHover,
  ...props
}: AnimatedButtonProps) {
  return (
    <Button className={className} {...props}>
      {Icon && iconPosition === "left" && <Icon className="h-4 w-4" aria-hidden />}
      {children}
      {Icon && iconPosition === "right" && (
        <Icon
          className="h-4 w-4 transition-transform duration-base ease-calm group-hover:translate-x-0.5"
          aria-hidden
        />
      )}
    </Button>
  );
}

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  /** Adds a hover state (border + shadow). Use only for cards that are clickable. */
  interactive?: boolean;
  /** @deprecated ignored — cards never scale. */
  hoverScale?: number;
  /** @deprecated ignored. */
  glowColor?: string;
}

/** Surface card. Static by default; `interactive` adds a quiet hover affordance. */
export function AnimatedCard({ children, className, interactive = false }: AnimatedCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-xs",
        interactive &&
          "transition-[border-color,box-shadow] duration-base ease-calm hover:border-input/60 hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

interface AnimatedStatProps {
  value: string | number;
  label: string;
  suffix?: string;
  prefix?: string;
  className?: string;
  delay?: number;
}

/** Large figure + caption. Fades in once when scrolled into view. */
export function AnimatedStat({
  value,
  label,
  suffix = "",
  prefix = "",
  className,
  delay = 0,
}: AnimatedStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("text-center sm:text-left", className)}
    >
      <div className="font-serif text-4xl font-semibold tabular-nums tracking-tight text-foreground">
        {prefix}
        {value}
        {suffix}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

interface StepIndicatorProps {
  step: number;
  label?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  className?: string;
}

/** Numbered step marker. State is conveyed by fill, border, a check icon and aria-current. */
export function StepIndicator({
  step,
  label,
  isActive,
  isCompleted,
  className,
}: StepIndicatorProps) {
  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      aria-current={isActive ? "step" : undefined}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors duration-base",
          isCompleted && "border-primary bg-primary text-primary-foreground",
          isActive && !isCompleted && "border-primary bg-card text-primary ring-4 ring-primary/10",
          !isActive && !isCompleted && "border-input/50 bg-card text-muted-foreground"
        )}
      >
        {isCompleted ? <Check className="h-4 w-4" aria-hidden /> : step}
      </span>
      {label && (
        <span
          className={cn(
            "hidden text-sm sm:inline",
            isActive || isCompleted ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
