import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CompanyLens + BlackBox — Multi-Agent Due Diligence & Reliability Layer",
  description:
    "3 AI agents analyze company legal contracts, financial metrics, and engineering health, backed by BlackBox telemetry and golden evaluation harness.",
  keywords: ["due diligence", "AI agents", "reliability", "evaluation", "telemetry", "LangGraph", "BlackBox"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="cockpit-grid text-[var(--color-bone)] min-h-screen">
        <main style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
