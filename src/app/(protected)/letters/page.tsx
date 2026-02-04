"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Letter {
  id: string;
  publicToken: string;
  title: string;
  style: string;
  sealType: string;
  recipientName: string | null;
  viewCount: number;
  isPublic: boolean;
  isSealed: boolean;
  createdAt: string;
}

const STYLE_LABELS: Record<string, string> = {
  standard: "Standard Letter",
  decree: "Official Decree",
  summons: "Formal Summons",
  prophecy: "Prophecy",
  warning: "Warning",
  commendation: "Commendation",
};

const SEAL_ICONS: Record<string, string> = {
  ouroboros: "☉",
  eye: "◉",
  serpent: "⛧",
  moon: "☽",
  void: "◯",
  mechanicus: "⚙",
};

export default function LettersPage() {
  const { data: session } = useSession();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLetters();
  }, []);

  async function fetchLetters() {
    try {
      const res = await fetch("/api/letters");
      if (res.ok) {
        setLetters(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch letters:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-gold tracking-wide">
            ✉ Sealed Letters
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            YOUR DISPATCHED CORRESPONDENCE
          </p>
        </div>

        <Link href="/letters/new" className="btn btn-primary flex items-center gap-2">
          <span>+</span>
          <span>COMPOSE LETTER</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
          <p className="font-mono text-muted animate-pulse">RETRIEVING LETTERS...</p>
        </div>
      ) : letters.length === 0 ? (
        <div className="card-document p-12 text-center">
          <div className="text-4xl text-gold-dim mb-4">✉</div>
          <p className="font-mono text-muted">NO LETTERS COMPOSED</p>
          <Link href="/letters/new" className="inline-block mt-4 btn btn-secondary">
            Compose Your First Letter
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {letters.map((letter) => (
            <LetterCard key={letter.id} letter={letter} />
          ))}
        </div>
      )}
    </div>
  );
}

function LetterCard({ letter }: { letter: Letter }) {
  const [copied, setCopied] = useState(false);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/letter/${letter.publicToken}`
      : "";

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article className="card-document overflow-hidden group hover:border-border-medium transition-all">
      <div className="p-6 text-center border-b border-border-dark bg-gradient-to-b from-gold/5 to-transparent">
        <div className="text-5xl text-gold animate-breathe mb-2">
          {SEAL_ICONS[letter.sealType] || "☉"}
        </div>
        <span className="font-mono text-[0.65rem] text-gold-dim tracking-widest">
          {letter.sealType.toUpperCase()} SEAL
        </span>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-display text-lg text-primary truncate">{letter.title}</h3>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-muted">STYLE:</span>
          <span className="font-mono text-secondary">
            {STYLE_LABELS[letter.style] || letter.style}
          </span>
        </div>

        {letter.recipientName && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-muted">TO:</span>
            <span className="font-mono text-secondary">{letter.recipientName}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-2 border-t border-border-dark">
          <span className="font-mono text-muted">
            {new Date(letter.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-2">
            {letter.isSealed && (
              <span className="badge badge-gold">SEALED</span>
            )}
            {letter.isPublic ? (
              <span className="font-mono text-class-green">
                {letter.viewCount} views
              </span>
            ) : (
              <span className="font-mono text-muted">PRIVATE</span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-dark border-t border-border-dark space-y-2">
        {letter.isPublic && (
          <button
            onClick={copyLink}
            className="w-full btn btn-secondary text-sm"
          >
            {copied ? "✓ LINK COPIED" : "COPY PUBLIC LINK"}
          </button>
        )}
        <Link
          href={`/letters/${letter.id}`}
          className="block w-full btn btn-secondary text-sm text-center"
        >
          {letter.isSealed ? "VIEW LETTER" : "EDIT LETTER"}
        </Link>
      </div>
    </article>
  );
}
