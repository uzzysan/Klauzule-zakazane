import { cn } from "@/lib/utils";

/**
 * FairPact mark: a contract page (the "pact") carrying an equals sign (the "fair").
 * Drawn on a 32-unit grid with a 2-unit stroke so it stays crisp from 16px up.
 * Uses currentColor — set the colour with a text-* class (normally text-primary).
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-7 w-7 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <path d="M9 3.5h10.5L26 10v16.5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-21a2 2 0 0 1 2-2Z" />
      <path d="M19.5 3.5V8a2 2 0 0 0 2 2H26" />
      <path d="M11.5 16.5h9M11.5 21.5h9" />
    </svg>
  );
}

/** Mark + serif wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="text-primary" />
      <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
        FairPact
      </span>
    </span>
  );
}
