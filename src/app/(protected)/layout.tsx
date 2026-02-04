import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";

function EffectsOverlay() {
  return (
    <>
      <div className="vignette-overlay" />
      <div className="scanlines-overlay" style={{ opacity: '0.02' }} />
      <div className="scan-line" />
      <div className="noise-overlay" style={{ opacity: '0.015' }} />
    </>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-void relative">
      <EffectsOverlay />

      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Navigation />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
