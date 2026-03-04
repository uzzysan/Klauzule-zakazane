"use client";

import { Card, CardContent } from "@/components/ui";
import {
  AnimatedIcon,
  IconContainer,
  StaggerContainer,
  StaggerItem,
  FadeIn,
} from "@/components/icons";
import { AnimatedButton, AnimatedCard, AnimatedStat } from "@/components/ui/animated-button";
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
    answer:
      "Klauzule niedozwolone to postanowienia umowne, które kształtują prawa i obowiązki konsumenta w sposób sprzeczny z dobrymi obyczajami, rażąco naruszając jego interesy. Są one nieważne z mocy prawa zgodnie z art. 385¹ Kodeksu cywilnego. Przykłady to jednostronne prawo do zmiany ceny, wyłączenie odpowiedzialności sprzedawcy czy automatyczne przedłużanie umowy.",
  },
  {
    question: "Jak działa analiza umowy w FairPact?",
    answer:
      "FairPact wykorzystuje zaawansowane algorytmy do porównywania tekstu umowy z bazą 7,233 klauzul uznanych za niedozwolone przez polskie sądy. System analizuje podobieństwo semantyczne oraz słowa kluczowe, przypisując każdemu dopasowaniu poziom ryzyka (wysoki, średni, niski) wraz z odniesieniem do konkretnego orzeczenia sądowego.",
  },
  {
    question: "Czy analiza jest bezpłatna?",
    answer:
      "Tak, podstawowa analiza umów jest całkowicie bezpłatna i nie wymaga rejestracji. Możesz przesłać dokument w formacie PDF, Word lub jako zdjęcie i otrzymać wyniki w kilkadziesiąt sekund. Dokumenty są dostępne tylko dla Ciebie i usuwane po zakończeniu sesji (max 8h).",
  },
  {
    question: "Jakie dokumenty mogę analizować?",
    answer:
      "FairPact obsługuje umowy najmu, regulaminy sklepów internetowych, umowy o świadczenie usług, umowy kredytowe i pożyczkowe, umowy z deweloperami, umowy telekomunikacyjne, regulaminy konkursów i wiele innych. System najlepiej sprawdza się przy umowach B2C (przedsiębiorca-konsument).",
  },
  {
    question: "Czy FairPact zastępuje poradę prawną?",
    answer:
      "Nie, FairPact jest narzędziem informacyjnym i nie stanowi porady prawnej. Wyniki analizy wskazują potencjalnie problematyczne zapisy, ale ostateczną ocenę i decyzje prawne powinien podjąć wykwalifikowany prawnik. Zalecamy konsultację z prawnikiem w przypadku wykrycia klauzul wysokiego ryzyka.",
  },
  {
    question: "Skąd pochodzi baza klauzul niedozwolonych?",
    answer:
      "Baza zawiera klauzule z rejestru UOKiK oraz orzeczeń Sądu Ochrony Konkurencji i Konsumentów (SOKiK). Każda klauzula posiada sygnaturę orzeczenia, datę wydania wyroku oraz informacje o stronach postępowania. Baza jest regularnie aktualizowana o nowe orzeczenia.",
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
            <FadeIn className="mx-auto max-w-4xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent"
              >
                <AnimatedIcon icon={Shield} size={16} animation="pulse" className="text-accent" />
                <span>Bezpłatna analiza bez rejestracji</span>
              </motion.div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Sprawdź umowę pod kątem <span className="text-accent">klauzul niedozwolonych</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl lg:mx-0">
                Prześlij umowę najmu, regulamin sklepu lub inny dokument. FairPact przeanalizuje go
                na podstawie <strong>7,233 orzeczeń polskich sądów</strong> i wskaże potencjalnie
                niebezpieczne zapisy.
              </p>

              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Link href="/upload">
                  <AnimatedButton
                    size="lg"
                    className="w-full px-8 text-base sm:w-auto"
                    icon={ArrowRight}
                    glowOnHover
                  >
                    Analizuj dokument za darmo
                  </AnimatedButton>
                </Link>
                <Link href="#jak-to-dziala">
                  <AnimatedButton
                    variant="outline"
                    size="lg"
                    className="w-full px-8 text-base sm:w-auto"
                    icon={ChevronDown}
                    iconPosition="right"
                  >
                    Jak to działa?
                  </AnimatedButton>
                </Link>
              </div>

              {/* Trust indicators */}
              <StaggerContainer
                className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground lg:justify-start"
                staggerDelay={0.1}
              >
                <StaggerItem>
                  <div className="flex items-center gap-2">
                    <AnimatedIcon
                      icon={CheckCircle2}
                      size={16}
                      className="text-green-600"
                      hoverScale={1.2}
                    />
                    <span>Bez rejestracji</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex items-center gap-2">
                    <AnimatedIcon
                      icon={CheckCircle2}
                      size={16}
                      className="text-green-600"
                      hoverScale={1.2}
                    />
                    <span>Prywatna sesja (max 8h)</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex items-center gap-2">
                    <AnimatedIcon
                      icon={CheckCircle2}
                      size={16}
                      className="text-green-600"
                      hoverScale={1.2}
                    />
                    <span>PDF, Word, zdjęcia</span>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </FadeIn>

            {/* Sponsor Slot */}
            <FadeIn delay={0.3} direction="left" className="hidden shrink-0 lg:block lg:w-[320px]">
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
                className="group relative overflow-hidden rounded-2xl border border-dashed border-accent/20 bg-accent/5 p-8 text-center transition-all hover:border-accent/40 hover:bg-accent/10"
              >
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    className="rounded-full bg-accent/10 p-3"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Gem className="h-8 w-8 text-accent" />
                  </motion.div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Ta strona będzie zawsze darmowa</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      a to miejsce czeka na jedną firmę chętną umieścić tu swoje logo z podpisem{" "}
                      <span className="font-semibold text-accent">dumny sponsor</span>.
                    </p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y bg-secondary/30 py-12">
          <div className="container">
            <div className="grid gap-8 text-center md:grid-cols-4">
              <AnimatedStat value="7,233" label="Klauzul w bazie" delay={0} />
              <AnimatedStat value="5,009" label="Orzeczeń sądowych" delay={0.1} />
              <AnimatedStat value="<30s" label="Czas analizy" delay={0.2} />
              <AnimatedStat value="100%" label="Bezpłatnie" delay={0.3} />
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section id="jak-to-dziala" className="container scroll-mt-20 py-20 md:py-28">
          <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Jak to działa?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Prosta analiza w trzech krokach — bez rejestracji, bez opłat
            </p>
          </FadeIn>

          <StaggerContainer className="grid gap-8 md:grid-cols-3" staggerDelay={0.15}>
            <StaggerItem>
              <div className="relative">
                <motion.div
                  className="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  1
                </motion.div>
                <AnimatedCard className="h-full pt-4" hoverScale={1.02}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <IconContainer
                        icon={FileSearch}
                        size={40}
                        animation="float"
                        className="mb-4 h-16 w-16 bg-accent/10"
                        iconClassName="text-accent"
                      />
                      <h3 className="mb-3 text-xl font-semibold">Prześlij dokument</h3>
                      <p className="text-muted-foreground">
                        PDF, Word lub zdjęcie umowy. Obsługujemy OCR dla skanów i zdjęć z telefonu.
                      </p>
                    </div>
                  </CardContent>
                </AnimatedCard>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="relative">
                <motion.div
                  className="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  2
                </motion.div>
                <AnimatedCard className="h-full pt-4" hoverScale={1.02}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <IconContainer
                        icon={Database}
                        size={40}
                        animation="pulse"
                        className="mb-4 h-16 w-16 bg-accent/10"
                        iconClassName="text-accent"
                      />
                      <h3 className="mb-3 text-xl font-semibold">Analiza semantyczna</h3>
                      <p className="text-muted-foreground">
                        System porównuje treść z bazą klauzul niedozwolonych z orzeczeń SOKiK i
                        UOKiK.
                      </p>
                    </div>
                  </CardContent>
                </AnimatedCard>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="relative">
                <motion.div
                  className="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  3
                </motion.div>
                <AnimatedCard className="h-full pt-4" hoverScale={1.02}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <IconContainer
                        icon={Shield}
                        size={40}
                        animation="pulse"
                        className="mb-4 h-16 w-16 bg-accent/10"
                        iconClassName="text-accent"
                      />
                      <h3 className="mb-3 text-xl font-semibold">Otrzymaj raport</h3>
                      <p className="text-muted-foreground">
                        Szczegółowy raport z oznaczonymi klauzulami, oceną ryzyka i odniesieniami do
                        orzeczeń.
                      </p>
                    </div>
                  </CardContent>
                </AnimatedCard>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Use Cases Section */}
        <section className="border-y bg-secondary/30 py-20 md:py-28">
          <div className="container">
            <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-3xl font-bold md:text-4xl">Jakie dokumenty możesz sprawdzić?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                FairPact sprawdzi się przy różnych typach umów konsumenckich
              </p>
            </FadeIn>

            <StaggerContainer
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
              staggerDelay={0.1}
            >
              <StaggerItem>
                <AnimatedCard
                  className="group transition-colors hover:border-accent/50"
                  hoverScale={1.03}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <motion.div
                        className="mb-4 rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-accent/10"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <HomeIcon className="h-8 w-8 text-primary transition-colors group-hover:text-accent" />
                      </motion.div>
                      <h3 className="mb-2 font-semibold">Umowy najmu</h3>
                      <p className="text-sm text-muted-foreground">
                        Mieszkania, lokale użytkowe, garaże
                      </p>
                    </div>
                  </CardContent>
                </AnimatedCard>
              </StaggerItem>

              <StaggerItem>
                <AnimatedCard
                  className="group transition-colors hover:border-accent/50"
                  hoverScale={1.03}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <motion.div
                        className="mb-4 rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-accent/10"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                      >
                        <ShoppingCart className="h-8 w-8 text-primary transition-colors group-hover:text-accent" />
                      </motion.div>
                      <h3 className="mb-2 font-semibold">Regulaminy sklepów</h3>
                      <p className="text-sm text-muted-foreground">
                        E-commerce, marketplace, usługi online
                      </p>
                    </div>
                  </CardContent>
                </AnimatedCard>
              </StaggerItem>

              <StaggerItem>
                <AnimatedCard
                  className="group transition-colors hover:border-accent/50"
                  hoverScale={1.03}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <motion.div
                        className="mb-4 rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-accent/10"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Building2 className="h-8 w-8 text-primary transition-colors group-hover:text-accent" />
                      </motion.div>
                      <h3 className="mb-2 font-semibold">Umowy deweloperskie</h3>
                      <p className="text-sm text-muted-foreground">
                        Zakup mieszkania, domu od dewelopera
                      </p>
                    </div>
                  </CardContent>
                </AnimatedCard>
              </StaggerItem>

              <StaggerItem>
                <AnimatedCard
                  className="group transition-colors hover:border-accent/50"
                  hoverScale={1.03}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <motion.div
                        className="mb-4 rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-accent/10"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                      >
                        <Briefcase className="h-8 w-8 text-primary transition-colors group-hover:text-accent" />
                      </motion.div>
                      <h3 className="mb-2 font-semibold">Umowy o usługi</h3>
                      <p className="text-sm text-muted-foreground">
                        Telekomunikacja, fitness, kursy
                      </p>
                    </div>
                  </CardContent>
                </AnimatedCard>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container py-20 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <FadeIn>
              <h2 className="mb-8 text-3xl font-bold md:text-4xl">Dlaczego FairPact?</h2>
              <StaggerContainer className="space-y-6" staggerDelay={0.15}>
                <StaggerItem>
                  <div className="flex gap-4">
                    <motion.div
                      className="h-fit flex-shrink-0 rounded-xl bg-primary/10 p-3"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                    >
                      <Scale className="h-6 w-6 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="mb-1 text-lg font-semibold">Podstawa w orzecznictwie</h3>
                      <p className="text-muted-foreground">
                        Każda klauzula w bazie pochodzi z rzeczywistego orzeczenia polskiego sądu.
                        Otrzymujesz sygnaturę sprawy i datę wyroku.
                      </p>
                    </div>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex gap-4">
                    <motion.div
                      className="h-fit flex-shrink-0 rounded-xl bg-primary/10 p-3"
                      whileHover={{ scale: 1.1, rotate: -10 }}
                    >
                      <Zap className="h-6 w-6 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="mb-1 text-lg font-semibold">Błyskawiczna analiza</h3>
                      <p className="text-muted-foreground">
                        Wyniki otrzymujesz w kilkadziesiąt sekund, nie dni. Idealnie przed
                        podpisaniem umowy lub w trakcie negocjacji.
                      </p>
                    </div>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex gap-4">
                    <motion.div
                      className="h-fit flex-shrink-0 rounded-xl bg-primary/10 p-3"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                    >
                      <Lock className="h-6 w-6 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="mb-1 text-lg font-semibold">Prywatność gwarantowana</h3>
                      <p className="text-muted-foreground">
                        Dokumenty są widoczne tylko dla Ciebie i usuwane automatycznie po
                        zakończeniu sesji (maks. 8h). Analiza odbywa się lokalnie, bez wysyłania
                        danych do zewnętrznych serwisów AI.
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </FadeIn>

            <FadeIn delay={0.3} direction="left" className="flex justify-center">
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
                <Card className="w-full max-w-md border-2 border-accent/20">
                  <CardContent className="pb-8 pt-8">
                    <div className="text-center">
                      <motion.div
                        className="mb-4 text-7xl font-bold text-accent"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                          delay: 0.5,
                        }}
                      >
                        85%
                      </motion.div>
                      <p className="mb-6 text-lg text-muted-foreground">
                        umów konsumenckich zawiera co najmniej jedną potencjalnie niedozwoloną
                        klauzulę
                      </p>
                      <Link href="/upload">
                        <AnimatedButton size="lg" className="w-full" icon={ArrowRight} glowOnHover>
                          Sprawdź swoją umowę
                        </AnimatedButton>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </FadeIn>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="scroll-mt-20 border-t bg-secondary/30 py-20 md:py-28">
          <div className="container">
            <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-3xl font-bold md:text-4xl">Często zadawane pytania</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Wszystko, co musisz wiedzieć o analizie klauzul niedozwolonych
              </p>
            </FadeIn>

            <StaggerContainer className="mx-auto max-w-3xl space-y-4" staggerDelay={0.1}>
              {faqs.map((faq, index) => (
                <StaggerItem key={index}>
                  <motion.div whileHover={{ scale: 1.01, x: 4 }} transition={{ duration: 0.2 }}>
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="mb-3 text-lg font-semibold">{faq.question}</h3>
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="container py-20 md:py-28">
          <FadeIn className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Gotowy sprawdzić swoją umowę?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Bezpłatna analiza bez rejestracji. Wyniki w kilkadziesiąt sekund.
            </p>
            <Link href="/upload">
              <AnimatedButton size="lg" className="px-10 text-base" icon={ArrowRight} glowOnHover>
                Rozpocznij analizę za darmo
              </AnimatedButton>
            </Link>
          </FadeIn>
        </section>
      </div>
    </>
  );
}

// Missing import
import { motion } from "framer-motion";
