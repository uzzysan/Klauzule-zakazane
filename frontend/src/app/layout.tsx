import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers, Header } from "@/components/layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
    title: "FairPact - Analiza umów",
    description: "Sprawdź umowę pod kątem klauzul niedozwolonych. Analiza oparta na 7,233 orzeczeniach sądowych.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pl" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`}>
                <Providers>
                    <div className="relative flex min-h-screen flex-col">
                        <Header />
                        <main className="flex-1">{children}</main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
