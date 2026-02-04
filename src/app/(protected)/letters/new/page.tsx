"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const STYLES = [
  { value: "standard", label: "Standard Letter", desc: "A formal correspondence" },
  { value: "decree", label: "Official Decree", desc: "An authoritative proclamation" },
  { value: "summons", label: "Formal Summons", desc: "A call to appear or act" },
  { value: "prophecy", label: "Prophecy", desc: "A mystical foretelling" },
  { value: "warning", label: "Warning", desc: "A cautionary message" },
  { value: "commendation", label: "Commendation", desc: "A letter of praise" },
];

const SEALS = [
  { value: "ouroboros", icon: "☉", label: "Ouroboros", desc: "The eternal cycle" },
  { value: "eye", icon: "◉", label: "All-Seeing Eye", desc: "Vigilance and knowledge" },
  { value: "serpent", icon: "⛧", label: "Serpent", desc: "Wisdom and transformation" },
  { value: "moon", icon: "☽", label: "Moon", desc: "Mystery and the hidden" },
  { value: "void", icon: "◯", label: "Void", desc: "The unknown depths" },
  { value: "mechanicus", icon: "⚙", label: "Mechanicus", desc: "The machine spirit" },
];

export default function NewLetterPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    content: "",
    style: "standard",
    sealType: "ouroboros",
    signature: session?.user?.name || "",
    recipientName: "",
    isPublic: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const letter = await res.json();
        router.push(`/letters/${letter.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create letter");
      }
    } catch (e) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-gold tracking-wide">
          ✉ Compose Letter
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          CRAFT YOUR CORRESPONDENCE
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="alert-banner alert-danger">
            <span className="font-mono">{error}</span>
          </div>
        )}

        <div className="card-document">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              ◈ LETTER STYLE & SEAL
            </span>
          </div>
          <div className="p-5 space-y-6">
            <div>
              <label className="form-label mb-3">Letter Style</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {STYLES.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setForm({ ...form, style: style.value })}
                    className={`p-3 text-left border transition-all ${
                      form.style === style.value
                        ? "border-gold bg-gold/10"
                        : "border-border-dark hover:border-border-medium"
                    }`}
                  >
                    <span className="font-mono text-sm text-primary block">
                      {style.label}
                    </span>
                    <span className="font-mono text-[0.65rem] text-muted">
                      {style.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label mb-3">Seal Type</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {SEALS.map((seal) => (
                  <button
                    key={seal.value}
                    type="button"
                    onClick={() => setForm({ ...form, sealType: seal.value })}
                    className={`p-4 text-center border transition-all ${
                      form.sealType === seal.value
                        ? "border-gold bg-gold/10"
                        : "border-border-dark hover:border-border-medium"
                    }`}
                  >
                    <span className="text-3xl text-gold block mb-1">{seal.icon}</span>
                    <span className="font-mono text-[0.6rem] text-muted">
                      {seal.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card-document">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              ☰ LETTER CONTENT
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="Letter title..."
                  required
                />
              </div>
              <div>
                <label className="form-label">Recipient (optional)</label>
                <input
                  type="text"
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  className="input"
                  placeholder="To whom it concerns..."
                />
              </div>
            </div>

            <div>
              <label className="form-label">
                Content <span className="text-danger">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="input min-h-[300px] font-body text-lg"
                placeholder="Write your letter..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Signature</label>
                <input
                  type="text"
                  value={form.signature}
                  onChange={(e) => setForm({ ...form, signature: e.target.value })}
                  className="input"
                  placeholder="Your signature..."
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                    className="w-5 h-5 accent-gold"
                  />
                  <span className="font-mono text-sm text-secondary">
                    Make publicly shareable
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card-document overflow-hidden">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              ◉ PREVIEW
            </span>
          </div>
          <div className="p-8 bg-gradient-to-b from-gold/5 to-transparent">
            <div className="text-center mb-6">
              <div className="text-6xl text-gold animate-breathe mb-2">
                {SEALS.find((s) => s.value === form.sealType)?.icon || "☉"}
              </div>
              <span className="font-mono text-[0.65rem] text-gold-dim tracking-widest">
                SEAL OF THE {form.sealType.toUpperCase()}
              </span>
            </div>

            <h2 className="font-display text-2xl text-center text-gold mb-6">
              {form.title || "Untitled Letter"}
            </h2>

            {form.recipientName && (
              <p className="font-body text-secondary italic text-center mb-4">
                To: {form.recipientName}
              </p>
            )}

            <div className="font-body text-secondary whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-hidden">
              {form.content || "Your letter content will appear here..."}
            </div>

            {form.signature && (
              <p className="font-body text-gold italic text-right mt-6">
                — {form.signature}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
          >
            CANCEL
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? (
              <>
                <span className="animate-spin">⚙</span>
                <span className="ml-2">CREATING...</span>
              </>
            ) : (
              <>
                <span>✉</span>
                <span className="ml-2">CREATE LETTER</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
