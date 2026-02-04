"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Letter {
  id: string;
  publicToken: string;
  title: string;
  content: string;
  style: string;
  sealType: string;
  signature: string | null;
  recipientName: string | null;
  viewCount: number;
  isPublic: boolean;
  isSealed: boolean;
  createdAt: string;
  authorId: string;
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

export default function LetterDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sealing, setSealing] = useState(false);

  const letterId = params.id as string;

  useEffect(() => {
    fetchLetter();
  }, [letterId]);

  async function fetchLetter() {
    try {
      const res = await fetch(`/api/letters/${letterId}`);
      if (res.ok) {
        setLetter(await res.json());
      } else {
        router.push("/letters");
      }
    } catch (error) {
      console.error("Failed to fetch letter:", error);
    } finally {
      setLoading(false);
    }
  }

  async function sealLetter() {
    if (!confirm("Once sealed, this letter cannot be edited. Continue?")) return;

    setSealing(true);
    try {
      const res = await fetch(`/api/letters/${letterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSealed: true }),
      });

      if (res.ok) {
        fetchLetter();
      }
    } catch (error) {
      console.error("Failed to seal letter:", error);
    } finally {
      setSealing(false);
    }
  }

  function copyLink() {
    if (!letter) return;
    const url = `${window.location.origin}/letter/${letter.publicToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
        <p className="font-mono text-muted animate-pulse">RETRIEVING LETTER...</p>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-danger mb-4">⚠</div>
        <p className="font-mono text-muted">LETTER NOT FOUND</p>
        <Link href="/letters" className="btn btn-secondary mt-4">
          RETURN TO LETTERS
        </Link>
      </div>
    );
  }

  const isOwner = letter.authorId === session?.user?.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/letters"
        className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-gold transition-colors"
      >
        ← RETURN TO LETTERS
      </Link>

      {isOwner && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {letter.isSealed ? (
              <span className="badge badge-gold">SEALED</span>
            ) : (
              <>
                <Link
                  href={`/letters/${letter.id}/edit`}
                  className="btn btn-secondary text-sm"
                >
                  EDIT
                </Link>
                <button
                  onClick={sealLetter}
                  disabled={sealing}
                  className="btn btn-secondary text-sm"
                >
                  {sealing ? "SEALING..." : "SEAL LETTER"}
                </button>
              </>
            )}
          </div>

          {letter.isPublic && (
            <button onClick={copyLink} className="btn btn-secondary text-sm">
              {copied ? "✓ COPIED" : "COPY PUBLIC LINK"}
            </button>
          )}
        </div>
      )}

      <article className="card-document overflow-hidden">
        <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 py-2 text-center border-b border-gold/30">
          <span className="font-mono text-[0.65rem] text-gold tracking-[0.3em]">
            {STYLE_HEADERS[letter.style] || "FOUNDATION CORRESPONDENCE"}
          </span>
        </div>

        <div className="p-8 text-center bg-gradient-to-b from-gold/10 via-transparent to-transparent">
          <div className="relative inline-block">
            <div className="text-7xl text-gold animate-breathe text-glow-gold">
              {SEAL_ICONS[letter.sealType] || "☉"}
            </div>
            <div className="absolute inset-0 border-2 border-gold/30 rounded-full animate-spin-slow" style={{ animationDuration: '30s' }} />
          </div>
          <p className="font-mono text-xs text-gold-dim tracking-widest mt-4">
            SEALED WITH THE MARK OF THE {letter.sealType.toUpperCase()}
          </p>
        </div>

        <div className="px-8 py-6 text-center border-y border-border-dark">
          <h1 className="font-display text-3xl text-gold tracking-wide">
            {letter.title}
          </h1>
          {letter.recipientName && (
            <p className="font-body text-lg text-secondary italic mt-2">
              To: {letter.recipientName}
            </p>
          )}
        </div>

        <div className="p-8">
          <div className="font-body text-lg text-secondary whitespace-pre-wrap leading-relaxed">
            {letter.content}
          </div>

          {letter.signature && (
            <div className="mt-8 pt-6 border-t border-border-dark text-right">
              <p className="font-body text-xl text-gold italic">
                — {letter.signature}
              </p>
              {letter.authorTitle && (
                <p className="font-mono text-xs text-muted mt-1">
                  {letter.authorTitle}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-8 py-4 bg-dark border-t border-border-dark flex items-center justify-between text-xs font-mono">
          <span className="text-muted">
            Composed: {new Date(letter.createdAt).toLocaleDateString()}
          </span>
          <span className="text-muted">
            {letter.isPublic ? `${letter.viewCount} views` : "PRIVATE"}
          </span>
        </div>
      </article>

      <div className="text-center binary-decoration py-4">
        THE WORD IS BOND · THE SEAL IS TRUTH
      </div>
    </div>
  );
}
