import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Providers, Header, Footer } from "@/components/layout";
import { Analytics } from "@/components/Analytics";

// UI typeface: Inter (high x-height, tabular figures, full Polish diacritics).
const fontSans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

// Display & reading typeface: Source Serif 4 with optical sizing.
const fontSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9F6F2" },
    { media: "(prefers-color-scheme: dark)", color: "#11151A" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fairpact.pl"),
  title: {
    default: "FairPact - Sprawdź umowę pod kątem klauzul niedozwolonych",
    template: "%s | FairPact",
  },
  description:
    "Bezpłatna analiza umów pod kątem klauzul niedozwolonych. Baza 7,233 orzeczeń sądowych z Polski. Sprawdź umowę najmu, regulamin sklepu lub umowę o pracę w kilka sekund.",
  keywords: [
    "klauzule niedozwolone",
    "analiza umowy",
    "klauzule abuzywne",
    "umowa najmu",
    "regulamin sklepu",
    "ochrona konsumenta",
    "UOKiK",
    "prawo konsumenckie",
    "sprawdzenie umowy",
    "niedozwolone postanowienia umowne",
  ],
  authors: [{ name: "FairPact" }],
  creator: "FairPact",
  publisher: "FairPact",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "/",
    siteName: "FairPact",
    title: "FairPact - Sprawdź umowę pod kątem klauzul niedozwolonych",
    description:
      "Bezpłatna analiza umów pod kątem klauzul niedozwolonych. Baza 7,233 orzeczeń sądowych. Sprawdź umowę w kilka sekund.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FairPact - Sprawdź umowę pod kątem klauzul niedozwolonych",
    description:
      "Bezpłatna analiza umów pod kątem klauzul niedozwolonych. Baza 7,233 orzeczeń sądowych.",
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontSerif.variable} font-sans antialiased`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
