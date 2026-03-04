"use client";

import { FileText, Github, Mail, Heart } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedIcon } from "@/components/icons";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/icons";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-5">
          {/* Brand */}
          <FadeIn className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatedIcon
                  icon={FileText}
                  size={20}
                  hoverScale={1.2}
                  className="text-accent-foreground"
                />
              </motion.div>
              <span className="text-xl font-bold">FairPact</span>
            </Link>
            <p className="max-w-md text-sm text-muted-foreground">
              Bezpłatne narzędzie do analizy umów pod kątem klauzul niedozwolonych. Oparte na bazie
              7,233 orzeczeń polskich sądów.
            </p>
          </FadeIn>

          {/* Links */}
          <StaggerContainer staggerDelay={0.05}>
            <h3 className="mb-4 font-semibold">Nawigacja</h3>
            <ul className="space-y-2 text-sm">
              <StaggerItem>
                <li>
                  <Link
                    href="/"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Strona główna
                  </Link>
                </li>
              </StaggerItem>
              <StaggerItem>
                <li>
                  <Link
                    href="/upload"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Analizuj umowę
                  </Link>
                </li>
              </StaggerItem>
              <StaggerItem>
                <li>
                  <Link
                    href="/#jak-to-dziala"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Jak to działa
                  </Link>
                </li>
              </StaggerItem>
              <StaggerItem>
                <li>
                  <Link
                    href="/#faq"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    FAQ
                  </Link>
                </li>
              </StaggerItem>
            </ul>
          </StaggerContainer>

          {/* Contact */}
          <StaggerContainer staggerDelay={0.05}>
            <h3 className="mb-4 font-semibold">Kontakt</h3>
            <ul className="space-y-2 text-sm">
              <StaggerItem>
                <li>
                  <motion.a
                    href="mailto:rafal.maculewicz@tuta.com"
                    className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnimatedIcon
                      icon={Mail}
                      size={12}
                      hoverScale={1.2}
                      className="text-muted-foreground"
                    />
                    E-mail
                  </motion.a>
                </li>
              </StaggerItem>
              <StaggerItem>
                <li>
                  <motion.a
                    href="https://github.com/uzzysan/Klauzule-zakazane"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnimatedIcon
                      icon={Github}
                      size={12}
                      hoverScale={1.2}
                      className="text-muted-foreground"
                    />
                    GitHub
                  </motion.a>
                </li>
              </StaggerItem>
            </ul>
          </StaggerContainer>

          {/* Support */}
          <FadeIn delay={0.2}>
            <h3 className="mb-4 font-semibold">Wesprzyj projekt</h3>
            <motion.a
              href="https://suppi.pl/rafcio"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <img
                width="165"
                src="https://suppi.pl/api/widget/button.svg?fill=6457FF&textColor=ffffff"
                alt="Wesprzyj mnie"
              />
            </motion.a>
          </FadeIn>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 border-t pt-8"
        >
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <motion.p className="flex items-center gap-1" whileHover={{ scale: 1.02 }}>
              &copy; {currentYear} Rafał Maculewicz. Wszelkie prawa zastrzeżone.
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              >
                <Heart className="h-3 w-3 text-red-500" fill="currentColor" />
              </motion.span>
            </motion.p>
            <p className="text-center md:text-right">
              <span className="block md:inline">Narzędzie ma charakter informacyjny.</span>{" "}
              <span className="block md:inline">Nie stanowi porady prawnej.</span>
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
