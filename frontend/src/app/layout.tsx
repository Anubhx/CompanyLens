import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CompanyLens — AI Due Diligence in 60 Seconds",
  description:
    "3 AI agents analyze a company's legal contracts, financial health, and engineering reputation in parallel — producing a structured due-diligence report in under 60 seconds.",
  keywords: ["due diligence", "AI agents", "company analysis", "LangGraph", "multi-agent"],
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-animate">
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(10, 10, 15, 0.8)',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          <a href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'var(--text-primary)',
          }}>
            <span style={{
              fontSize: '24px',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              letterSpacing: '-0.5px',
            }}>◉</span>
            <span style={{
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.3px',
            }}>CompanyLens</span>
          </a>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              padding: '4px 12px',
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)',
            }}>
              Multi-Agent AI
            </span>
          </div>
        </nav>
        <main style={{ paddingTop: '72px', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
