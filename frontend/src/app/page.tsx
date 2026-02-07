import { Button, Card, CardContent } from "@/components/ui";
import {
    ArrowRight,
    Briefcase,
    Building2,
    CheckCircle2,
    ChevronDown,
    Database,
    FileSearch,
    Gem,
    Home as HomeIcon,
    Lock,
    Scale,
    Shield,
    ShoppingCart,
    Zap,
} from "lucide-react";
import Link from "next/link";
import Script from "next/script";

// FAQ data for SEO
const faqs = [
    {
        question: "Czym są klauzule niedozwolone (abuzywne)?",
        answer: "Klauzule niedozwolone to postanowienia umowne, które kształtują prawa i obowiązki konsumenta w sposób sprzeczny z dobrymi obyczajami, rażąco naruszając jego interesy. Są one nieważne z mocy prawa zgodnie z art. 385¹ Kodeksu cywilnego. Przykłady to jednostronne prawo do zmiany ceny, wyłączenie odpowiedzialności sprzedawcy czy automatyczne przedłużanie umowy.",
    },
    {
        question: "Jak działa analiza umowy w FairPact?",
        answer: "FairPact wykorzystuje zaawansowane algorytmy do porównywania tekstu umowy z bazą 7,233 klauzul uznanych za niedozwolone przez polskie sądy. System analizuje podobieństwo semantyczne oraz słowa kluczowe, przypisując każdemu dopasowaniu poziom ryzyka (wysoki, średni, niski) wraz z odniesieniem do konkretnego orzeczenia sądowego.",
    },
    {
        question: "Czy analiza jest bezpłatna?",
        answer: "Tak, podstawowa analiza umów jest całkowicie bezpłatna i nie wymaga rejestracji. Możesz przesłać dokument w formacie PDF, Word lub jako zdjęcie i otrzymać wyniki w kilkadziesiąt sekund. Dokumenty są dostępne tylko dla Ciebie i usuwane po zakończeniu sesji (max 8h).",
    },
    {
        question: "Jakie dokumenty mogę analizować?",
        answer: "FairPact obsługuje umowy najmu, regulaminy sklepów internetowych, umowy o świadczenie usług, umowy kredytowe i pożyczkowe, umowy z deweloperami, umowy telekomunikacyjne, regulaminy konkursów i wiele innych. System najlepiej sprawdza się przy umowach B2C (przedsiębiorca-konsument).",
    },
    {
        question: "Czy FairPact zastępuje poradę prawną?",
        answer: "Nie, FairPact jest narzędziem informacyjnym i nie stanowi porady prawnej. Wyniki analizy wskazują potencjalnie problematyczne zapisy, ale ostateczną ocenę i decyzje prawne powinien podjąć wykwalifikowany prawnik. Zalecamy konsultację z prawnikiem w przypadku wykrycia klauzul wysokiego ryzyka.",
    },
    {
        question: "Skąd pochodzi baza klauzul niedozwolonych?",
        answer: "Baza zawiera klauzule z rejestru UOKiK oraz orzeczeń Sądu Ochrony Konkurencji i Konsumentów (SOKiK). Każda klauzula posiada sygnaturę orzeczenia, datę wydania wyroku oraz informacje o stronach postępowania. Baza jest regularnie aktualizowana o nowe orzeczenia.",
    },
];

// JSON-LD structured data as strings
const appJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FairPact",
    description:
        "Bezpłatna analiza umów pod kątem klauzul niedozwolonych oparta na bazie 7,233 orzeczeń sądowych",
    url: "https://fairpact.pl",
    applicationCategory: "LegalService",
    operatingSystem: "Web",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "PLN",
    },
    featureList: [
        "Analiza umów PDF, DOCX i obrazów",
        "Baza 7,233 klauzul niedozwolonych",
        "Wyniki w kilkadziesiąt sekund",
        "Bez rejestracji",
    ],
});

const faqJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
        },
    })),
});

export default function Home() {
    return (
        <>
            {/* Structured Data */}
            <Script
                id="jsonld-app"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: appJsonLd }}
            />
            <Script
                id="jsonld-faq"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: faqJsonLd }}
            />

            <div className="flex flex-col">
                {/* Hero Section */}
                <section className="container py-20 md:py-28">
                    <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
                        <div className="mx-auto max-w-4xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
                                <Shield className="h-4 w-4" />
                                <span>Bezpłatna analiza bez rejestracji</span>
                            </div>

                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                                Sprawdź umowę pod kątem{" "}
                                <span className="text-accent">klauzul niedozwolonych</span>
                            </h1>

                            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl lg:mx-0">
                                Prześlij umowę najmu, regulamin sklepu lub inny dokument. FairPact
                                przeanalizuje go na podstawie{" "}
                                <strong>7,233 orzeczeń polskich sądów</strong> i wskaże
                                potencjalnie niebezpieczne zapisy.
                            </p>

                            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                                <Link href="/upload">
                                    <Button size="lg" className="w-full px-8 text-base sm:w-auto">
                                        Analizuj dokument za darmo
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="#jak-to-dziala">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-full px-8 text-base sm:w-auto"
                                    >
                                        Jak to działa?
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust indicators */}
                            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground lg:justify-start">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span>Bez rejestracji</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span>Prywatna sesja (max 8h)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span>PDF, Word, zdjęcia</span>
                                </div>
                            </div>
                        </div>

                        {/* Sponsor Slot */}
                        <div className="hidden shrink-0 lg:block lg:w-[320px]">
                            <div className="group relative overflow-hidden rounded-2xl border border-dashed border-accent/20 bg-accent/5 p-8 text-center transition-all hover:border-accent/40 hover:bg-accent/10">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="rounded-full bg-accent/10 p-3">
                                        <Gem className="h-8 w-8 text-accent" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-medium text-foreground">
                                            Ta strona będzie zawsze darmowa
                                        </p>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            a to miejsce czeka na jedną firmę chętną umieścić tu
                                            swoje logo z podpisem{" "}
                                            <span className="font-semibold text-accent">
                                                dumny sponsor
                                            </span>
                                            .
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="border-y bg-secondary/30 py-12">
                    <div className="container">
                        <div className="grid gap-8 md:grid-cols-4 text-center">
                            <div>
                                <div className="text-4xl font-bold text-accent">7,233</div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    Klauzul w bazie
                                </div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-accent">5,009</div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    Orzeczeń sądowych
                                </div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-accent">&lt;30s</div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    Czas analizy
                                </div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-accent">100%</div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    Bezpłatnie
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it works Section */}
                <section id="jak-to-dziala" className="container py-20 md:py-28 scroll-mt-20">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-3xl font-bold md:text-4xl">Jak to działa?</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Prosta analiza w trzech krokach — bez rejestracji, bez opłat
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="relative">
                            <div className="absolute -top-4 -left-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-lg">
                                1
                            </div>
                            <Card className="h-full pt-4">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-4 p-4 bg-accent/10 rounded-2xl">
                                            <FileSearch className="h-10 w-10 text-accent" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">
                                            Prześlij dokument
                                        </h3>
                                        <p className="text-muted-foreground">
                                            PDF, Word lub zdjęcie umowy. Obsługujemy OCR dla
                                            skanów i zdjęć z telefonu.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="relative">
                            <div className="absolute -top-4 -left-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-lg">
                                2
                            </div>
                            <Card className="h-full pt-4">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-4 p-4 bg-accent/10 rounded-2xl">
                                            <Database className="h-10 w-10 text-accent" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">
                                            Analiza semantyczna
                                        </h3>
                                        <p className="text-muted-foreground">
                                            System porównuje treść z bazą klauzul niedozwolonych
                                            z orzeczeń SOKiK i UOKiK.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="relative">
                            <div className="absolute -top-4 -left-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-lg">
                                3
                            </div>
                            <Card className="h-full pt-4">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-4 p-4 bg-accent/10 rounded-2xl">
                                            <Shield className="h-10 w-10 text-accent" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">
                                            Otrzymaj raport
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Szczegółowy raport z oznaczonymi klauzulami, oceną
                                            ryzyka i odniesieniami do orzeczeń.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Use Cases Section */}
                <section className="border-y bg-secondary/30 py-20 md:py-28">
                    <div className="container">
                        <div className="mx-auto max-w-2xl text-center mb-16">
                            <h2 className="text-3xl font-bold md:text-4xl">
                                Jakie dokumenty możesz sprawdzić?
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                FairPact sprawdzi się przy różnych typach umów konsumenckich
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <Card className="group hover:border-accent/50 transition-colors">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-4 p-3 bg-primary/10 rounded-xl group-hover:bg-accent/10 transition-colors">
                                            <HomeIcon className="h-8 w-8 text-primary group-hover:text-accent transition-colors" />
                                        </div>
                                        <h3 className="font-semibold mb-2">Umowy najmu</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Mieszkania, lokale użytkowe, garaże
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="group hover:border-accent/50 transition-colors">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-4 p-3 bg-primary/10 rounded-xl group-hover:bg-accent/10 transition-colors">
                                            <ShoppingCart className="h-8 w-8 text-primary group-hover:text-accent transition-colors" />
                                        </div>
                                        <h3 className="font-semibold mb-2">Regulaminy sklepów</h3>
                                        <p className="text-sm text-muted-foreground">
                                            E-commerce, marketplace, usługi online
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="group hover:border-accent/50 transition-colors">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-4 p-3 bg-primary/10 rounded-xl group-hover:bg-accent/10 transition-colors">
                                            <Building2 className="h-8 w-8 text-primary group-hover:text-accent transition-colors" />
                                        </div>
                                        <h3 className="font-semibold mb-2">Umowy deweloperskie</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Zakup mieszkania, domu od dewelopera
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="group hover:border-accent/50 transition-colors">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-4 p-3 bg-primary/10 rounded-xl group-hover:bg-accent/10 transition-colors">
                                            <Briefcase className="h-8 w-8 text-primary group-hover:text-accent transition-colors" />
                                        </div>
                                        <h3 className="font-semibold mb-2">Umowy o usługi</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Telekomunikacja, fitness, kursy
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="container py-20 md:py-28">
                    <div className="grid gap-12 lg:grid-cols-2 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-8 md:text-4xl">
                                Dlaczego FairPact?
                            </h2>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 p-3 bg-primary/10 rounded-xl h-fit">
                                        <Scale className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">
                                            Podstawa w orzecznictwie
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Każda klauzula w bazie pochodzi z rzeczywistego
                                            orzeczenia polskiego sądu. Otrzymujesz sygnaturę sprawy
                                            i datę wyroku.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 p-3 bg-primary/10 rounded-xl h-fit">
                                        <Zap className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">
                                            Błyskawiczna analiza
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Wyniki otrzymujesz w kilkadziesiąt sekund, nie dni.
                                            Idealnie przed podpisaniem umowy lub w trakcie
                                            negocjacji.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 p-3 bg-primary/10 rounded-xl h-fit">
                                        <Lock className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">
                                            Prywatność gwarantowana
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Dokumenty są widoczne tylko dla Ciebie i usuwane automatycznie
                                            po zakończeniu sesji (maks. 8h). Analiza odbywa się lokalnie, bez wysyłania
                                            danych do zewnętrznych serwisów AI.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <Card className="w-full max-w-md border-2 border-accent/20">
                                <CardContent className="pt-8 pb-8">
                                    <div className="text-center">
                                        <div className="text-7xl font-bold text-accent mb-4">
                                            85%
                                        </div>
                                        <p className="text-lg text-muted-foreground mb-6">
                                            umów konsumenckich zawiera co najmniej jedną
                                            potencjalnie niedozwoloną klauzulę
                                        </p>
                                        <Link href="/upload">
                                            <Button size="lg" className="w-full">
                                                Sprawdź swoją umowę
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="border-t bg-secondary/30 py-20 md:py-28 scroll-mt-20">
                    <div className="container">
                        <div className="mx-auto max-w-2xl text-center mb-16">
                            <h2 className="text-3xl font-bold md:text-4xl">
                                Często zadawane pytania
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Wszystko, co musisz wiedzieć o analizie klauzul niedozwolonych
                            </p>
                        </div>

                        <div className="mx-auto max-w-3xl space-y-4">
                            {faqs.map((faq, index) => (
                                <Card key={index}>
                                    <CardContent className="pt-6">
                                        <h3 className="font-semibold text-lg mb-3">
                                            {faq.question}
                                        </h3>
                                        <p className="text-muted-foreground">{faq.answer}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="container py-20 md:py-28">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-3xl font-bold mb-4 md:text-4xl">
                            Gotowy sprawdzić swoją umowę?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Bezpłatna analiza bez rejestracji. Wyniki w kilkadziesiąt sekund.
                        </p>
                        <Link href="/upload">
                            <Button size="lg" className="text-base px-10">
                                Rozpocznij analizę za darmo
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
}
