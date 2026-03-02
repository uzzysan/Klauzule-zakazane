import { FileText, Github, Mail } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-secondary/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">FairPact</span>
            </Link>
            <p className="max-w-md text-sm text-muted-foreground">
              Bezpłatne narzędzie do analizy umów pod kątem klauzul niedozwolonych. Oparte na bazie
              7,233 orzeczeń polskich sądów.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 font-semibold">Nawigacja</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Strona główna
                </Link>
              </li>
              <li>
                <Link
                  href="/upload"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Analizuj umowę
                </Link>
              </li>
              <li>
                <Link
                  href="/#jak-to-dziala"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Jak to działa
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold">Kontakt</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:rafal.maculewicz@tuta.com"
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="h-3 w-3" />
                  E-mail
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/uzzysan/Klauzule-zakazane"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Github className="h-3 w-3" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 font-semibold">Wesprzyj projekt</h3>
            <a href="https://suppi.pl/rafcio" target="_blank" rel="noopener noreferrer">
              <img
                width="165"
                src="https://suppi.pl/api/widget/button.svg?fill=6457FF&textColor=ffffff"
                alt="Wesprzyj mnie"
              />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <p>&copy; {currentYear} Rafał Maculewicz. Wszelkie prawa zastrzeżone.</p>
            <p className="text-center md:text-right">
              <span className="block md:inline">Narzędzie ma charakter informacyjny.</span>{" "}
              <span className="block md:inline">Nie stanowi porady prawnej.</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
