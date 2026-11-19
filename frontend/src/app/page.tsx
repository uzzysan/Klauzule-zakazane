"use client";

import { useState, useEffect } from "react";
import { FadeIn, StaggerContainer, StaggerItem, IconContainer } from "@/components/icons";
import { AnimatedStat } from "@/components/ui/animated-button";
import { buttonVariants } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Home as HomeIcon,
  Lock,
  Scale,
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

const steps = [
  {
    title: "Prześlij dokument",
    desc: "Dodaj plik PDF, Word (DOCX) lub zdjęcie umowy wykonane telefonem. Moduł OCR zamieni obraz na tekst.",
  },
  {
    title: "Analiza semantyczna",
    desc: "Treść porównujemy z bazą orzeczeń Sądu Ochrony Konkurencji i Konsumentów, badając sens zapisów, a nie tylko słowa.",
  },
  {
    title: "Przejrzysty raport",
    desc: "Otrzymujesz raport z zaznaczonymi fragmentami, poziomem ryzyka, stopniem dopasowania i sygnaturami wyroków.",
  },
];

const useCases = [
  { title: "Umowy najmu", desc: "Mieszkania, lokale, najem okazjonalny", icon: HomeIcon },
  { title: "Regulaminy e-sklepów", desc: "Zakupy online, zwroty i dostawy", icon: ShoppingCart },
  { title: "Umowy deweloperskie", desc: "Zakup nieruchomości, kary umowne", icon: Building2 },
  { title: "Umowy o usługi", desc: "Abonamenty, siłownie, szkolenia", icon: Briefcase },
];

const benefits = [
  {
    title: "Rzetelna podstawa prawna",
    desc: "W przeciwieństwie do chatbotów, które mogą halucynować, FairPact wiąże każde wykryte ryzyko z konkretną sygnaturą wyroku polskiego sądu.",
    icon: Scale,
  },
  {
    title: "Wynik w kilkadziesiąt sekund",
    desc: "Raport pojawia się bezpośrednio na ekranie — idealnie tuż przed podpisaniem ważnego zobowiązania.",
    icon: Zap,
  },
  {
    title: "Prywatność i bezpieczeństwo",
    desc: "Analiza korzysta z lokalnie uruchamianych modeli. Dokumenty służą wyłącznie do wygenerowania raportu i są trwale usuwane.",
    icon: Lock,
  },
];

const trust = [
  "Bez rejestracji i ukrytych opłat",
  "Pliki usuwane po 8 godzinach",
  "PDF, DOCX oraz zdjęcia (OCR)",
];

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
  const clausesStr = stats ? stats.clauses.toLocaleString("pl-PL") : "7 233";
  const rulingsStr = stats ? stats.rulings.toLocaleString("pl-PL") : "5 009";

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

      {/* Hero */}
      <section className="container pb-16 pt-14 md:pb-24 md:pt-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <FadeIn className="lg:col-span-7">
            <p className="eyebrow mb-5">Analiza klauzul niedozwolonych</p>
            <h1 className="text-[2.5rem] leading-[1.1] tracking-[-0.02em] sm:text-display-lg lg:text-[3.75rem]">
              Sprawdź umowę, <span className="italic text-primary">zanim</span> ją podpiszesz.
            </h1>
            <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">
              Prześlij umowę najmu, regulamin lub ofertę. FairPact porówna jej zapisy z bazą{" "}
              <span className="font-medium text-foreground">{clausesStr} klauzul abuzywnych</span> z
              rejestru UOKiK i wyroków SOKiK — i wskaże, co warto wyjaśnić.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/upload"
                className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}
              >
                Rozpocznij bezpłatną analizę
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-base ease-calm group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="#jak-to-dziala"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "w-full sm:w-auto",
                })}
              >
                Jak to działa
                <ChevronDown className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <ul className="mt-10 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
              {trust.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </FadeIn>

          {/* Document preview */}
          <FadeIn delay={0.15} className="lg:col-span-5">
            <figure
              aria-label="Przykładowy fragment raportu"
              className="relative mx-auto w-full max-w-[440px] rounded-xl border bg-card shadow-lg"
            >
              <div className="flex items-center justify-between border-b px-5 py-3">
                <span className="truncate text-xs font-medium text-muted-foreground">
                  umowa_najmu_mieszkania.pdf
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">str. 2 / 6</span>
              </div>
              <div className="space-y-4 px-5 py-6 font-serif text-[0.9375rem] leading-relaxed">
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  § 4. Opłaty i kaucja
                </p>
                <p>
                  1. Kaucja może zostać zatrzymana{" "}
                  <span className="highlight-high pointer-events-none">
                    w całości, bez względu na faktyczną wysokość szkody
                  </span>
                  , w przypadku wcześniejszego rozwiązania umowy.
                </p>
                <p>
                  2. Wynajmujący zastrzega sobie{" "}
                  <span className="highlight-medium pointer-events-none">
                    prawo do zmiany czynszu bez uprzedniego powiadomienia
                  </span>{" "}
                  Najemcy.
                </p>
              </div>
              <figcaption className="flex flex-wrap items-center gap-2 border-t bg-muted/50 px-5 py-3 text-xs text-muted-foreground">
                <RiskBadge level="high" />
                <RiskBadge level="medium" />
                <span className="ml-auto">2 zapisy do wyjaśnienia</span>
              </figcaption>
            </figure>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="FairPact w liczbach" className="border-y bg-muted/40">
        <div className="container grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-4 md:py-14">
          <AnimatedStat value={clausesStr} label="klauzul niedozwolonych w bazie" />
          <AnimatedStat value={rulingsStr} label="orzeczeń sądowych" delay={0.05} />
          <AnimatedStat value="< 30 s" label="średni czas analizy" delay={0.1} />
          <AnimatedStat value="0 zł" label="bez rejestracji i opłat" delay={0.15} />
        </div>
      </section>

      {/* How it works */}
      <section id="jak-to-dziala" className="container scroll-mt-24 py-20 md:py-28">
        <FadeIn className="max-w-2xl">
          <p className="eyebrow mb-3">Jak to działa</p>
          <h2 className="text-display-sm md:text-display-md">Trzy kroki do spokojnej decyzji</h2>
        </FadeIn>

        <StaggerContainer className="mt-12 grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3">
          {steps.map((step, i) => (
            <StaggerItem key={step.title} className="bg-card p-6 sm:p-8">
              <span className="font-serif text-4xl font-semibold tabular-nums text-primary/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 text-lg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Use cases */}
      <section className="border-y bg-muted/40 py-20 md:py-28">
        <div className="container">
          <FadeIn className="max-w-2xl">
            <p className="eyebrow mb-3">Zastosowania</p>
            <h2 className="text-display-sm md:text-display-md">
              Jakie dokumenty możesz zweryfikować?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Najlepsze wyniki daje przy umowach konsumenckich (B2C) i umowach najmu.
            </p>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {useCases.map((item) => (
              <StaggerItem key={item.title} className="h-full">
                <div className="flex h-full items-start gap-4 rounded-xl border bg-card p-5 shadow-xs">
                  <IconContainer icon={item.icon} />
                  <div>
                    <h3 className="text-base">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Benefits */}
      <section className="container py-20 md:py-28">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <FadeIn>
              <p className="eyebrow mb-3">Dlaczego FairPact</p>
              <h2 className="text-display-sm md:text-display-md">Precyzja zamiast przypuszczeń</h2>
            </FadeIn>
            <StaggerContainer className="mt-10 space-y-8">
              {benefits.map((item) => (
                <StaggerItem key={item.title} className="flex gap-4">
                  <IconContainer icon={item.icon} />
                  <div>
                    <h3 className="text-lg">{item.title}</h3>
                    <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          <FadeIn delay={0.1} className="lg:col-span-5">
            <div className="mx-auto max-w-sm rounded-xl border bg-card p-8 shadow-md">
              <div className="font-serif text-7xl font-semibold leading-none tracking-tight text-primary">
                85%
              </div>
              <p className="mt-4 text-base leading-relaxed">
                umów konsumenckich w Polsce zawiera co najmniej jedną klauzulę niedozwoloną.
              </p>
              <Link href="/upload" className={buttonVariants({ className: "mt-8 w-full" })}>
                Sprawdź swoją umowę
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-base ease-calm group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-t bg-muted/40 py-20 md:py-28">
        <div className="container grid gap-12 lg:grid-cols-12">
          <FadeIn className="lg:col-span-4">
            <p className="eyebrow mb-3">FAQ</p>
            <h2 className="text-display-sm md:text-display-md">Często zadawane pytania</h2>
            <p className="mt-4 text-muted-foreground">
              Zasady prawne i techniczne stojące za analizą umów.
            </p>
          </FadeIn>

          <div className="divide-y rounded-xl border bg-card lg:col-span-8">
            {faqs.map((faq, i) => (
              <details key={faq.question} className="group" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 px-5 py-5 text-base font-medium transition-colors duration-base hover:bg-accent/40 sm:px-6 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown
                    className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-base ease-calm group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="max-w-prose px-5 pb-6 text-sm leading-relaxed text-muted-foreground sm:px-6">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-20 md:py-28">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-display-sm md:text-display-md">Podpisuj świadomie</h2>
          <p className="mx-auto mt-4 max-w-prose text-lg text-muted-foreground">
            Analiza jest bezpłatna i nie wymaga rejestracji. Raport otrzymasz w kilka chwil.
          </p>
          <Link href="/upload" className={buttonVariants({ size: "lg", className: "mt-8" })}>
            Rozpocznij bezpłatną analizę
            <ArrowRight
              className="h-4 w-4 transition-transform duration-base ease-calm group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </FadeIn>
      </section>
    </>
  );
}
