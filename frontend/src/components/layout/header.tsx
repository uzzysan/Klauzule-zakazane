"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/#jak-to-dziala", label: "Jak to działa" },
  { href: "/#faq", label: "FAQ" },
];

export function Header() {
  const pathname = usePathname();
  const onUpload = pathname === "/upload";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            aria-label="FairPact — strona główna"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <Logo />
          </Link>

          <nav aria-label="Główna nawigacja" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-base hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Link
            href="/upload"
            aria-current={onUpload ? "page" : undefined}
            className={cn(
              "group inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors duration-base sm:px-4",
              onUpload
                ? "bg-muted text-foreground"
                : "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
            )}
          >
            Analizuj umowę
            {!onUpload && (
              <ArrowRight
                className="hidden h-4 w-4 transition-transform duration-base group-hover:translate-x-0.5 sm:block"
                aria-hidden
              />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
