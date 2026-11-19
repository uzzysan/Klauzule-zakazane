import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  /** Text shown next to the spinner while loading. */
  loadingText?: string;
}

const baseStyles =
  "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-base ease-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

const variants = {
  default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
  outline: "border border-input/60 bg-card text-foreground hover:border-input hover:bg-accent",
  secondary: "bg-muted text-foreground hover:bg-accent",
  ghost: "text-foreground hover:bg-accent",
  link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
};

const sizes = {
  default: "h-10 px-4",
  sm: "h-9 px-3",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

/** Button classes for non-button elements (e.g. a Next <Link> styled as a button). */
export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: { variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string } = {}) {
  return cn(baseStyles, variants[variant], variant !== "link" && sizes[size], className);
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading,
      loadingText = "Ładowanie…",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {loadingText}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
