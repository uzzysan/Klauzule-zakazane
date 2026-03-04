"use client";

import { motion } from "framer-motion";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
}

export function AnimatedButton({
  icon: Icon,
  iconPosition = "right",
  children,
  className,
  glowOnHover = false,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <Button className={cn(glowOnHover && "hover:shadow-lg hover:shadow-accent/25", className)} {...props}>
        {Icon && iconPosition === "left" && (
          <motion.span
            className="mr-2 inline-flex"
            whileHover={{ rotate: -10, scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="h-4 w-4" />
          </motion.span>
        )}
        {children}
        {Icon && iconPosition === "right" && (
          <motion.span
            className="ml-2 inline-flex"
            whileHover={{ x: 4, scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="h-4 w-4" />
          </motion.span>
        )}
      </Button>
    </motion.div>
  );
}

// Card z hover animation
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  glowColor?: string;
}

export function AnimatedCard({
  children,
  className,
  hoverScale = 1.02,
  glowColor,
}: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={{ 
        scale: hoverScale,
        y: -4,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow",
        glowColor && "hover:shadow-lg",
        className
      )}
      style={glowColor ? { 
        boxShadow: `0 0 0 ${glowColor}00`,
      } : undefined}
    >
      {children}
    </motion.div>
  );
}

// Stat number z counting animation
interface AnimatedStatProps {
  value: string | number;
  label: string;
  suffix?: string;
  prefix?: string;
  className?: string;
  delay?: number;
}

export function AnimatedStat({
  value,
  label,
  suffix = "",
  prefix = "",
  className,
  delay = 0,
}: AnimatedStatProps) {
  // Extract numeric part if value is a string with numbers
  const numericMatch = String(value).match(/[\d,]+/);
  const numericValue = numericMatch ? parseInt(numericMatch[0].replace(/,/g, ""), 10) : 0;
  const isNumeric = !isNaN(numericValue) && numericValue > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn("text-center", className)}
    >
      <motion.div
        className="text-4xl font-bold text-accent"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: delay + 0.1,
        }}
      >
        {prefix}
        {isNumeric ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.2 }}
          >
            {value}
          </motion.span>
        ) : (
          value
        )}
        {suffix}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.3 }}
        className="mt-1 text-sm text-muted-foreground"
      >
        {label}
      </motion.div>
    </motion.div>
  );
}

// Step indicator z animation
interface StepIndicatorProps {
  step: number;
  isActive?: boolean;
  isCompleted?: boolean;
  className?: string;
}

export function StepIndicator({
  step,
  isActive,
  isCompleted,
  className,
}: StepIndicatorProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        scale: isActive ? 1.1 : 1,
        backgroundColor: isCompleted
          ? "hsl(var(--accent))"
          : isActive
          ? "hsl(var(--accent))"
          : "hsl(var(--muted))",
      }}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold",
        isCompleted || isActive
          ? "text-accent-foreground"
          : "text-muted-foreground",
        className
      )}
    >
      <motion.span
        key={isCompleted ? "check" : step}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {isCompleted ? "✓" : step}
      </motion.span>
    </motion.div>
  );
}
