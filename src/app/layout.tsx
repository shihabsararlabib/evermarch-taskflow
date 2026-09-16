import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evermarch Bangladesh — Printer Repair Task Flow & Reliability Manager",
  description:
    "Enterprise printer repair task flow manager with serial tracking, 5+ repair limit viability alerts, company sub-branches database, and technician workflow dispatch.",
  keywords: [
    "Evermarch Bangladesh",
    "printer repair",
    "kanban",
    "serial tracking",
    "technician dispatch",
    "repair registry",
    "Bangladesh",
  ],
  openGraph: {
    title: "Evermarch Bangladesh — Printer Repair Task Flow & Reliability Manager",
    description:
      "Enterprise printer repair task flow manager with serial tracking, 5+ repair limit viability alerts, and technician workflow dispatch.",
    type: "website",
  },
};

import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased transition-colors duration-300`}>{children}</body>
    </html>
  );
}
