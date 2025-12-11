import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers, Header, Footer } from "@/components/layout";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });

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
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "FairPact - Analiza klauzul niedozwolonych",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "FairPact - Sprawdź umowę pod kątem klauzul niedozwolonych",
        description:
            "Bezpłatna analiza umów pod kątem klauzul niedozwolonych. Baza 7,233 orzeczeń sądowych.",
        images: ["/og-image.png"],
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
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <meta name="theme-color" content="#E65100" />
            </head>
            <body className={`${inter.variable} font-sans antialiased`}>
                <Providers>
                    <div className="relative flex min-h-screen flex-col">
                        <Header />
                        <main className="flex-1">{children}</main>
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    );
}
