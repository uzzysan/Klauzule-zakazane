"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Upload, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { AnimatedIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Start", icon: Shield },
    { href: "/upload", label: "Analizuj", icon: Upload },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatedIcon
                icon={FileText}
                size={20}
                hoverScale={1.2}
                className="text-accent-foreground"
              />
            </motion.div>
            <motion.span
              className="text-xl font-bold"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              FairPact
            </motion.span>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      className={cn(
                        "gap-2 transition-all duration-300",
                        pathname === item.href && "bg-secondary"
                      )}
                    >
                      <motion.span
                        whileHover={pathname !== item.href ? { rotate: 10, scale: 1.1 } : {}}
                        transition={{ duration: 0.2 }}
                      >
                        <item.icon className="h-4 w-4" />
                      </motion.span>
                      {item.label}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
