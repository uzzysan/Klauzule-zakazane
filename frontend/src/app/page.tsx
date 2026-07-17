"use client";

import { useState, useEffect } from "react";
import { CardContent } from "@/components/ui";
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
  Home as HomeIcon,
  Lock,
  Scale,
  Shield,
  ShoppingCart,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { motion } from "framer-motion";

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
  const [stats, setStats] = useState<{ clauses: number; rulings: number } | null>(null);
  useEffect(() => {
    fetch("/api/v1/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.clauses === "number") setStats(d);
      })
      .catch(() => {});
  }, []);
  const clausesStr = stats ? stats.clauses.toLocaleString("en-US") : "7,233";
  const rulingsStr = stats ? stats.rulings.toLocaleString("en-US") : "5,009";

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

      <div className="relative flex flex-col overflow-hidden">
        {/* Background Decorative Gradients */}
        <div className="pointer-events-none absolute left-[-20%] top-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/5" />
        <div className="dark:bg-rose-500/2 pointer-events-none absolute right-[-10%] top-[20%] h-[500px] w-[500px] rounded-full bg-rose-500/5 blur-[100px]" />

        {/* Hero Section */}
        <section className="container relative pb-20 pt-24 md:pb-28 md:pt-32">
          <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
            <FadeIn className="text-center lg:col-span-7 lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary dark:bg-primary/20"
              >
                <AnimatedIcon icon={Shield} size={14} animation="pulse" className="text-primary" />
                <span>Bezpieczne połączenie SSL i prywatność danych</span>
              </motion.div>

              <h1 className="text-4xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Sprawdź swoją umowę w{" "}
                <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                  kilka sekund
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:mx-0">
                Prześlij umowę najmu, regulamin lub ofertę handlową. System FairPact automatycznie
                porówna zapisy z bazą <strong>7 233 klauzul abuzywnych</strong> na podstawie wyroków
                UOKiK i SOKiK.
              </p>

              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Link href="/upload">
                  <AnimatedButton
                    size="lg"
                    className="w-full px-8 py-6 text-base font-semibold shadow-md shadow-primary/20 sm:w-auto"
                    icon={ArrowRight}
                    glowOnHover
                  >
                    Rozpocznij analizę (Bezpłatnie)
                  </AnimatedButton>
                </Link>
                <Link href="#jak-to-dziala">
                  <AnimatedButton
                    variant="outline"
                    size="lg"
                    className="w-full px-8 py-6 text-base font-medium hover:bg-secondary/80 sm:w-auto"
                    icon={ChevronDown}
                    iconPosition="right"
                  >
                    Dowiedz się więcej
                  </AnimatedButton>
                </Link>
              </div>

              {/* Trust Indicators */}
              <StaggerContainer
                className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-medium text-muted-foreground lg:justify-start"
                staggerDelay={0.1}
              >
                <StaggerItem className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Bez rejestracji i ukrytych opłat</span>
                </StaggerItem>
                <StaggerItem className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Pliki usuwane po 8 godzinach</span>
                </StaggerItem>
                <StaggerItem className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Obsługa PDF, DOCX oraz zdjęć (OCR)</span>
                </StaggerItem>
              </StaggerContainer>
            </FadeIn>

            {/* Interactive Mockup Visual */}
            <FadeIn delay={0.2} className="flex justify-center lg:col-span-5">
              <motion.div
                whileHover={{ y: -6, rotate: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative w-full max-w-[420px] rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70"
              >
                {/* Mockup header */}
                <div className="mb-4 flex items-center justify-between border-b pb-4 dark:border-slate-800">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500" />
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    umowa_najmu_mieszkania.pdf
                  </div>
                </div>

                {/* Mockup text simulation */}
                <div className="space-y-3 font-mono text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  <p>§ 4. OPŁATY I KAUCJA ZABEZPIECZAJĄCA</p>
                  <p>
                    1. Wynajmujący oświadcza, iż kaucja może zostać zatrzymana w całości w przypadku
                    rozwiązania umowy przez Najemcę przed terminem...
                  </p>
                  <div className="rounded-md border border-rose-200 bg-rose-50/50 p-2 dark:border-rose-950/40 dark:bg-rose-950/20">
                    <span className="font-bold text-rose-500">
                      [Zapis niedozwolony - Wysokie ryzyko]
                    </span>
                    <br />
                    „...zatrzymana w całości bez względu na faktyczną wartość szkody...”
                  </div>
                  <p>
                    2. Wynajmujący zastrzega sobie wyłączne prawo do natychmiastowej zmiany
                    wysokości czynszu o wskaźnik inflacji powiększony o 5%...
                  </p>
                  <div className="rounded-md border border-amber-200 bg-amber-50/50 p-2 dark:border-amber-950/40 dark:bg-amber-950/20">
                    <span className="font-bold text-amber-500">
                      [Zapis niejednoznaczny - Średnie ryzyko]
                    </span>
                    <br />
                    „...prawo do natychmiastowej zmiany bez uprzedniego powiadomienia..."
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative z-10 border-y border-slate-200/60 bg-slate-100/50 py-16 dark:border-slate-800/60 dark:bg-slate-900/30">
          <div className="container">
            <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
              <AnimatedStat value={clausesStr} label="Wykrytych klauzul niedozwolonych" delay={0} />
              <AnimatedStat
                value={rulingsStr}
                label="Przeanalizowanych spraw sądowych"
                delay={0.1}
              />
              <AnimatedStat value="< 30s" label="Średni czas analizy dokumentu" delay={0.2} />
              <AnimatedStat value="100%" label="Bezpłatny audyt prawny konsumenta" delay={0.3} />
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section id="jak-to-dziala" className="container scroll-mt-24 py-24 md:py-32">
          <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Jak działa FairPact?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Wygodna i szybka analiza dokumentów prawnych w trzech prostych krokach
            </p>
          </FadeIn>

          <StaggerContainer className="grid gap-8 md:grid-cols-3" staggerDelay={0.15}>
            <StaggerItem>
              <AnimatedCard
                className="h-full border border-slate-200/80 bg-white/60 p-8 dark:border-slate-800/80 dark:bg-slate-900/60"
                hoverScale={1.03}
              >
                <div className="flex flex-col items-center text-center">
                  <IconContainer
                    icon={FileSearch}
                    size={28}
                    animation="float"
                    className="mb-6 rounded-2xl bg-primary/10 p-4 text-primary"
                  />
                  <h3 className="mb-3 text-xl font-bold">1. Prześlij dokument</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Dodaj plik PDF, Word (DOCX) lub zdjęcie umowy wykonane smartfonem. Nasz moduł
                    OCR automatycznie przekonwertuje obrazy na tekst.
                  </p>
                </div>
              </AnimatedCard>
            </StaggerItem>

            <StaggerItem>
              <AnimatedCard
                className="h-full border border-slate-200/80 bg-white/60 p-8 dark:border-slate-800/80 dark:bg-slate-900/60"
                hoverScale={1.03}
              >
                <div className="flex flex-col items-center text-center">
                  <IconContainer
                    icon={Database}
                    size={28}
                    animation="pulse"
                    className="mb-6 rounded-2xl bg-primary/10 p-4 text-primary"
                  />
                  <h3 className="mb-3 text-xl font-bold">2. Analiza semantyczna</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Algorytm porównuje treść z bazą orzeczeń Sądu Ochrony Konkurencji i Konsumentów
                    (SOKiK), badając kontekst i sens zapisów.
                  </p>
                </div>
              </AnimatedCard>
            </StaggerItem>

            <StaggerItem>
              <AnimatedCard
                className="h-full border border-slate-200/80 bg-white/60 p-8 dark:border-slate-800/80 dark:bg-slate-900/60"
                hoverScale={1.03}
              >
                <div className="flex flex-col items-center text-center">
                  <IconContainer
                    icon={Shield}
                    size={28}
                    animation="bounce"
                    className="mb-6 rounded-2xl bg-primary/10 p-4 text-primary"
                  />
                  <h3 className="mb-3 text-xl font-bold">3. Przejrzysty raport</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Otrzymujesz przejrzysty, interaktywny raport z zaznaczonymi fragmentami ryzyka,
                    stopniem pewności oraz sygnaturami wyroków.
                  </p>
                </div>
              </AnimatedCard>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Use Cases Section */}
        <section className="border-y border-slate-200/60 bg-slate-100/50 py-24 dark:border-slate-800/60 dark:bg-slate-900/30 md:py-32">
          <div className="container">
            <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Jakie dokumenty możesz zweryfikować?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Zoptymalizowany pod kątem umów konsumenckich (B2C) i najmu
              </p>
            </FadeIn>

            <StaggerContainer
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
              staggerDelay={0.08}
            >
              {[
                {
                  title: "Umowy najmu",
                  desc: "Mieszkania, lokale, najem okazjonalny",
                  icon: HomeIcon,
                },
                {
                  title: "Regulaminy e-sklepów",
                  desc: "Zakupy online, polityki zwrotów i dostaw",
                  icon: ShoppingCart,
                },
                {
                  title: "Umowy deweloperskie",
                  desc: "Zakup nieruchomości, kary umowne",
                  icon: Building2,
                },
                {
                  title: "Umowy o świadczenie usług",
                  desc: "Abonamenty, siłownie, szkolenia",
                  icon: Briefcase,
                },
              ].map((item, idx) => (
                <StaggerItem key={idx}>
                  <AnimatedCard
                    className="group h-full border border-slate-200/60 bg-white p-6 transition-all hover:border-primary/45 dark:border-slate-800/60 dark:bg-slate-900"
                    hoverScale={1.04}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 rounded-xl bg-slate-100 p-3 text-slate-700 transition-colors group-hover:bg-primary/10 group-hover:text-primary dark:bg-slate-800 dark:text-slate-300">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <h4 className="mb-2 font-bold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  </AnimatedCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container py-24 md:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-12">
            <FadeIn className="lg:col-span-7">
              <h2 className="mb-8 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                Dlaczego warto wybrać FairPact?
              </h2>
              <StaggerContainer className="space-y-8" staggerDelay={0.1}>
                {[
                  {
                    title: "Rzetelna podstawa prawna",
                    desc: "W przeciwieństwie do standardowych chatbotów AI, które mogą halucynować, FairPact wiąże każde wykryte ryzyko z konkretną sygnaturą wyroku sądowego w Polsce.",
                    icon: Scale,
                  },
                  {
                    title: "Błyskawiczny czas reakcji",
                    desc: "Raport z analizy otrzymasz bezpośrednio na ekranie w czasie rzeczywistym. Idealne rozwiązanie tuż przed podpisaniem ważnego zobowiązania.",
                    icon: Zap,
                  },
                  {
                    title: "100% Prywatności i bezpieczeństwa",
                    desc: "Analiza opiera się na lokalnie uruchamianych modelach. Dokumenty są przechowywane wyłącznie w celu wygenerowania analizy i są trwale usuwane.",
                    icon: Lock,
                  },
                ].map((item, idx) => (
                  <StaggerItem key={idx} className="flex gap-4">
                    <div className="h-fit flex-shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="mb-1 text-lg font-bold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </FadeIn>

            <FadeIn delay={0.2} className="flex justify-center lg:col-span-5">
              <AnimatedCard
                className="w-full max-w-[360px] border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-8 text-center"
                hoverScale={1.02}
              >
                <div className="mb-2 text-[72px] font-extrabold leading-none text-primary">85%</div>
                <p className="text-md mb-6 font-medium text-slate-700 dark:text-slate-300">
                  umów konsumenckich w Polsce zawiera co najmniej jedną klauzulę niedozwoloną
                </p>
                <Link href="/upload">
                  <AnimatedButton size="lg" className="w-full" icon={ArrowRight} glowOnHover>
                    Przetestuj swoją umowę
                  </AnimatedButton>
                </Link>
              </AnimatedCard>
            </FadeIn>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          className="scroll-mt-24 border-t border-slate-200/60 bg-slate-100/30 py-24 dark:border-slate-800/60 dark:bg-slate-900/10 md:py-32"
        >
          <div className="container">
            <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Często zadawane pytania
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Poznaj zasady prawne i techniczne stojące za analizą umów
              </p>
            </FadeIn>

            <StaggerContainer className="mx-auto max-w-3xl space-y-4" staggerDelay={0.1}>
              {faqs.map((faq, index) => (
                <StaggerItem key={index}>
                  <AnimatedCard
                    className="border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900"
                    hoverScale={1.01}
                  >
                    <CardContent className="p-6">
                      <h4 className="mb-2 text-base font-bold text-slate-800 dark:text-slate-200">
                        {faq.question}
                      </h4>
                      <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </AnimatedCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="container py-24 text-center md:py-32">
          <FadeIn className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Zadbaj o swoje bezpieczeństwo prawne
            </h2>
            <p className="mb-8 mt-4 text-lg text-muted-foreground">
              Analiza umowy jest darmowa i nie wymaga rejestracji. Otrzymaj precyzyjny raport w
              kilka chwil.
            </p>
            <Link href="/upload">
              <AnimatedButton
                size="lg"
                className="px-10 py-6 text-base font-semibold shadow-lg shadow-primary/20"
                icon={ArrowRight}
                glowOnHover
              >
                Rozpocznij darmową analizę
              </AnimatedButton>
            </Link>
          </FadeIn>
        </section>
      </div>
    </>
  );
}
