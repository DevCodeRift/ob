"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface PublicLetter {
  id: string;
  publicToken: string;
  title: string;
  content: string;
  style: string;
  sealType: string;
  signature: string | null;
  recipientName: string | null;
  viewCount: number;
  createdAt: string;
  authorName: string;
  authorTitle: string | null;
}

const SEAL_ICONS: Record<string, string> = {
  ouroboros: "☉",
  eye: "◉",
  serpent: "⛧",
  moon: "☽",
  void: "◯",
  mechanicus: "⚙",
};

const STYLE_HEADERS: Record<string, string> = {
  standard: "OFFICIAL CORRESPONDENCE",
  decree: "BY DECREE OF THE FOUNDATION",
  summons: "FORMAL SUMMONS",
  prophecy: "A VISION REVEALED",
  warning: "URGENT WARNING",
  commendation: "LETTER OF COMMENDATION",
};

const STYLE_CLASSES: Record<string, string> = {
  standard: "",
  decree: "border-gold",
  summons: "border-danger",
  prophecy: "border-purple-mystic",
  warning: "border-danger",
  commendation: "border-class-green",
};

export default function PublicLetterPage() {
  const params = useParams();
  const token = params.token as string;

  const [letter, setLetter] = useState<PublicLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLetter();
  }, [token]);

  async function fetchLetter() {
    try {
      const res = await fetch(`/api/letters/public/${token}`);
      if (res.ok) {
        setLetter(await res.json());
      } else {
        const data = await res.json();
        setError(data.error || "Letter not found");
      }
    } catch (e) {
      setError("Failed to load letter");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
          <p className="font-mono text-muted animate-pulse">
            UNSEALING DOCUMENT...
          </p>
        </div>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="text-6xl text-danger mb-6">⚠</div>
          <h1 className="font-display text-2xl text-danger mb-4">
            Document Unavailable
          </h1>
          <p className="font-body text-secondary mb-6">
            {error || "This letter could not be found or is not publicly accessible."}
          </p>
          <Link href="/" className="btn btn-secondary">
            RETURN TO GATEWAY
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void py-12 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {["⛧", "☉", "☽", "⚙", "◎"].map((symbol, i) => (
          <div
            key={i}
            className="absolute text-gold-dim animate-float"
            style={{
              left: `${(i * 23) % 100}%`,
              top: `${(i * 17) % 100}%`,
              fontSize: "2rem",
              opacity: 0.05,
              animationDelay: `${i * 3}s`,
            }}
          >
            {symbol}
          </div>
        ))}
      </div>

      <article className={`max-w-3xl mx-auto relative z-10 card-document overflow-hidden ${STYLE_CLASSES[letter.style]}`}>
        <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 py-3 text-center border-b border-gold/30">
          <span className="font-mono text-[0.7rem] text-gold tracking-[0.4em]">
            {STYLE_HEADERS[letter.style] || "FOUNDATION CORRESPONDENCE"}
          </span>
        </div>

        <div className="py-12 text-center bg-gradient-to-b from-gold/10 via-transparent to-transparent">
          <div className="relative inline-block">
            <div className="text-8xl text-gold animate-breathe text-glow-gold">
              {SEAL_ICONS[letter.sealType] || "☉"}
            </div>
            <div
              className="absolute inset-0 border-2 border-gold/20 rounded-full"
              style={{
                transform: "scale(1.5)",
                animation: "spin 40s linear infinite",
              }}
            />
            <div
              className="absolute inset-0 border border-gold/10 rounded-full"
              style={{
                transform: "scale(2)",
                animation: "spin 60s linear infinite reverse",
              }}
            />
          </div>
          <p className="font-mono text-xs text-gold-dim tracking-[0.3em] mt-6">
            SEALED WITH THE MARK OF THE {letter.sealType.toUpperCase()}
          </p>
        </div>

        <div className="divider-gradient mx-12" />

        <div className="px-12 py-8 text-center">
          <h1 className="font-display text-4xl text-gold tracking-wide mb-4">
            {letter.title}
          </h1>
          {letter.recipientName && (
            <p className="font-body text-xl text-secondary italic">
              To: {letter.recipientName}
            </p>
          )}
        </div>

        <div className="px-12 py-8">
          <div className="font-body text-xl text-secondary whitespace-pre-wrap leading-relaxed">
            {letter.content}
          </div>
        </div>

        {letter.signature && (
          <div className="px-12 pb-8 text-right">
            <div className="divider-gradient mb-8" />
            <p className="font-body text-2xl text-gold italic">
              — {letter.signature}
            </p>
            {letter.authorTitle && (
              <p className="font-mono text-sm text-muted mt-2">
                {letter.authorTitle}
              </p>
            )}
          </div>
        )}

        <div className="px-12 py-6 bg-dark border-t border-border-dark">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>
              Composed: {new Date(letter.createdAt).toLocaleDateString()}
            </span>
            <span>{letter.viewCount} witnesses</span>
          </div>
        </div>
      </article>

      <div className="max-w-3xl mx-auto mt-8 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-dark/50 border border-border-dark">
          <span className="text-2xl text-gold">☉</span>
          <div className="text-left">
            <p className="font-mono text-xs text-gold tracking-widest">
              OUROBOROS FOUNDATION
            </p>
            <p className="font-mono text-[0.6rem] text-muted">
              OFFICIAL DOCUMENT
            </p>
          </div>
        </div>

        <p className="latin-phrase text-sm mt-6">
          The serpent devours itself, and from its death, is reborn eternal.
        </p>

        <div className="mt-6 binary-decoration text-xs">
          01001111 01010101 01010010 01001111 01000010 01001111 01010010 01001111 01010011
        </div>
      </div>
    </div>
  );
}
