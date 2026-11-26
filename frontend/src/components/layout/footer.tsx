import Link from "next/link";
import { Github, Heart, Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { IdeaDialog } from "@/components/idea/idea-dialog";

const linkClass =
  "inline-flex items-center gap-2 rounded-sm text-muted-foreground transition-colors duration-base hover:text-foreground";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-12">
          <div className="sm:col-span-2 md:col-span-5">
            <Link href="/" aria-label="FairPact — strona główna" className="inline-block">
              <Logo />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Bezpłatne narzędzie do analizy umów pod kątem klauzul niedozwolonych, oparte na
              orzeczeniach polskich sądów i rejestrze UOKiK.
            </p>
          </div>

          <nav aria-label="Stopka — nawigacja" className="md:col-span-2">
            <h2 className="eyebrow mb-4 font-sans">Nawigacja</h2>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className={linkClass}>
                  Strona główna
                </Link>
              </li>
              <li>
                <Link href="/upload" className={linkClass}>
                  Analizuj umowę
                </Link>
              </li>
              <li>
                <Link href="/#jak-to-dziala" className={linkClass}>
                  Jak to działa
                </Link>
              </li>
              <li>
                <Link href="/#faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
            </ul>
          </nav>

          <div className="md:col-span-2">
            <h2 className="eyebrow mb-4 font-sans">Kontakt</h2>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="mailto:rafal.maculewicz@tuta.com" className={linkClass}>
                  <Mail className="h-4 w-4" aria-hidden />
                  E-mail
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/uzzysan/Klauzule-zakazane"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <Github className="h-4 w-4" aria-hidden />
                  GitHub
                </a>
              </li>
              <li>
                <IdeaDialog />
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h2 className="eyebrow mb-4 font-sans">Wesprzyj projekt</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              FairPact jest darmowy. Jeśli Ci pomógł, możesz wesprzeć jego rozwój.
            </p>
            <a
              href="https://suppi.pl/rafcio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-input/60 bg-card px-4 text-sm font-medium text-foreground transition-colors duration-base hover:border-input hover:bg-accent"
            >
              <Heart className="h-4 w-4 text-primary" aria-hidden />
              Wesprzyj na Suppi
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>&copy; {currentYear} Rafał Maculewicz. Wszelkie prawa zastrzeżone.</p>
          <p>Narzędzie ma charakter informacyjny i nie stanowi porady prawnej.</p>
        </div>
      </div>
    </footer>
  );
}
