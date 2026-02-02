import { FileText, Github, Mail } from "lucide-react";
import Link from "next/link";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t bg-secondary/30">
            <div className="container py-12">
                <div className="grid gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                <FileText className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold">FairPact</span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Bezpłatne narzędzie do analizy umów pod kątem klauzul niedozwolonych.
                            Oparte na bazie 7,233 orzeczeń polskich sądów.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-semibold mb-4">Nawigacja</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    href="/"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Strona główna
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/upload"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Analizuj umowę
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#jak-to-dziala"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Jak to działa
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#faq"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Contact */}
                    <div>
                        <h3 className="font-semibold mb-4">Informacje</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    href="/polityka-prywatnosci"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Polityka prywatności
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/regulamin"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Regulamin
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="mailto:rafal.maculewicz@gmail.com"
                                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                                >
                                    <Mail className="h-3 w-3" />
                                    Kontakt
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/uzzysan/Klauzule-zakazane"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                                >
                                    <Github className="h-3 w-3" />
                                    GitHub
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                        <p>&copy; {currentYear} Rafał Maculewicz. Wszelkie prawa zastrzeżone.</p>
                        <p className="text-center md:text-right">
                            <span className="block md:inline">
                                Narzędzie ma charakter informacyjny.
                            </span>{" "}
                            <span className="block md:inline">
                                Nie stanowi porady prawnej.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
