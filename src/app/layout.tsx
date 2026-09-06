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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased transition-colors duration-300">{children}</body>
    </html>
  );
}
