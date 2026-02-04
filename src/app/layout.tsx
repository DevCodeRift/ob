import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import {
  Scanlines,
  Vignette,
  FloatingSymbols,
  CornerDecorations,
} from "@/components/effects";

export const metadata: Metadata = {
  title: "Ouroboros Foundation",
  description: "Internal Operations Portal - Authorized Personnel Only",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          <Scanlines />
          <Vignette />
          <FloatingSymbols />
          <CornerDecorations />

          <main className="relative z-10 min-h-screen">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
