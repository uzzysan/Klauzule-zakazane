import Link from "next/link";
import { ArrowRight, Shield, FileSearch, Scale, Database, Zap, Lock } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";

export default function Home() {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="container py-24 md:py-32">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                        Sprawdź swoją umowę pod kątem{" "}
                        <span className="text-accent">klauzul niedozwolonych</span>
                    </h1>
                    <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                        FairPact analizuje dokumenty prawne wykorzystując bazę 7,233 orzeczeń sądowych.
                        Wykryj potencjalnie niebezpieczne zapisy przed podpisaniem umowy.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/upload">
                            <Button size="lg" className="w-full sm:w-auto">
                                Analizuj dokument
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                            Dowiedz się więcej
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container py-16 md:py-24">
                <div className="mx-auto max-w-2xl text-center mb-12">
                    <h2 className="text-3xl font-bold">Jak to działa?</h2>
                    <p className="mt-4 text-muted-foreground">
                        Prosta analiza w trzech krokach
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 p-3 bg-accent/10 rounded-full">
                                    <FileSearch className="h-8 w-8 text-accent" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">1. Prześlij dokument</h3>
                                <p className="text-muted-foreground">
                                    PDF, Word lub zdjęcie umowy. Obsługujemy wszystkie popularne formaty.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 p-3 bg-accent/10 rounded-full">
                                    <Database className="h-8 w-8 text-accent" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">2. Analiza AI</h3>
                                <p className="text-muted-foreground">
                                    System porównuje treść z bazą klauzul niedozwolonych z orzeczeń sądowych.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 p-3 bg-accent/10 rounded-full">
                                    <Shield className="h-8 w-8 text-accent" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">3. Otrzymaj raport</h3>
                                <p className="text-muted-foreground">
                                    Szczegółowy raport z oznaczonymi klauzulami i oceną ryzyka.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Stats Section */}
            <section className="border-y bg-secondary/30 py-16">
                <div className="container">
                    <div className="grid gap-8 md:grid-cols-3 text-center">
                        <div>
                            <div className="text-4xl font-bold text-accent">7,233</div>
                            <div className="mt-2 text-muted-foreground">Klauzul w bazie</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-accent">5,009</div>
                            <div className="mt-2 text-muted-foreground">Orzeczeń sądowych</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-accent">&lt;30s</div>
                            <div className="mt-2 text-muted-foreground">Czas analizy</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="container py-16 md:py-24">
                <div className="grid gap-12 md:grid-cols-2 items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">Dlaczego FairPact?</h2>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg h-fit">
                                    <Scale className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Podstawa prawna</h3>
                                    <p className="text-muted-foreground">
                                        Baza oparta na rzeczywistych orzeczeniach polskich sądów
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg h-fit">
                                    <Zap className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Szybka analiza</h3>
                                    <p className="text-muted-foreground">
                                        Wyniki w kilkadziesiąt sekund, nie dni
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg h-fit">
                                    <Lock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Prywatność</h3>
                                    <p className="text-muted-foreground">
                                        Dokumenty gości są automatycznie usuwane po 24h
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <Card className="w-full max-w-md">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-6xl font-bold text-accent mb-2">85%</div>
                                    <p className="text-muted-foreground">
                                        umów zawiera co najmniej jedną potencjalnie niedozwoloną klauzulę
                                    </p>
                                    <Link href="/upload" className="mt-6 inline-block">
                                        <Button>
                                            Sprawdź swoją umowę
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="border-t bg-secondary/30 py-16">
                <div className="container text-center">
                    <h2 className="text-2xl font-bold mb-4">
                        Gotowy sprawdzić swoją umowę?
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Bezpłatna analiza bez rejestracji
                    </p>
                    <Link href="/upload">
                        <Button size="lg">
                            Rozpocznij analizę
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
