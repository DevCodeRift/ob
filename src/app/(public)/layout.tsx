export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-void relative">
      <div className="scanlines-overlay" style={{ opacity: "0.03" }} />
      <div className="vignette-overlay" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
