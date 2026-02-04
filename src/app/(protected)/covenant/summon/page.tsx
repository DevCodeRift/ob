"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CovenantSummonPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    targetName: "",
    proposedTitle: "",
    proposedRole: "aspirant",
    proposedSignil: "",
    invocationText: "",
    expiresInDays: 30,
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/");
    }
  }, [session, status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/covenant/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        const fullUrl = `${window.location.origin}${data.inviteUrl}`;
        setSuccess({ url: fullUrl });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create summons");
      }
    } catch (e) {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (success?.url) {
      await navigator.clipboard.writeText(success.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-6xl text-amber-500 animate-pulse">⛧</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="text-6xl text-amber-500 mb-6 animate-breathe">⛧</div>
          <h1 className="font-display text-3xl text-amber-500 mb-4">
            The Summons Is Prepared
          </h1>
          <p className="text-gray-400 mb-8">
            Send this sacred link to {form.targetName}. They will create their own credentials
            during the initiation ceremony.
          </p>

          <div className="bg-black/50 border border-amber-500/30 p-6 mb-6">
            <p className="text-amber-500/60 text-xs tracking-widest mb-2">CEREMONIAL LINK</p>
            <p className="text-amber-300 font-mono text-sm break-all mb-4">
              {success.url}
            </p>
            <button
              onClick={copyToClipboard}
              className="px-6 py-2 border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 transition-all font-mono text-sm"
            >
              {copied ? "COPIED!" : "COPY TO CLIPBOARD"}
            </button>
          </div>

          <p className="text-gray-500 text-sm mb-8">
            Expires in {form.expiresInDays} days
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setSuccess(null);
                setForm({
                  targetName: "",
                  proposedTitle: "",
                  proposedRole: "aspirant",
                  proposedSignil: "",
                  invocationText: "",
                  expiresInDays: 30,
                });
              }}
              className="px-6 py-2 border border-amber-500/30 text-amber-500/70 hover:text-amber-500 hover:border-amber-500/50 transition-all font-mono text-sm"
            >
              SUMMON ANOTHER
            </button>
            <Link
              href="/covenant"
              className="px-6 py-2 border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 transition-all font-mono text-sm"
            >
              RETURN TO ORDER
            </Link>
          </div>
        </div>

        <style jsx global>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          .animate-breathe { animation: breathe 4s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link
            href="/covenant"
            className="inline-block font-mono text-xs text-amber-500/50 hover:text-amber-500 mb-4 transition-colors"
          >
            ← RETURN TO ORDER
          </Link>
          <div className="text-5xl text-amber-500 mb-4">⛧</div>
          <h1 className="font-display text-3xl text-amber-500 tracking-wider mb-2">
            SUMMON INITIATE
          </h1>
          <p className="text-amber-500/60 text-sm">
            Extend the sacred invitation to a worthy soul
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 p-4 text-red-400 font-mono text-sm">
              {error}
            </div>
          )}

          <div className="bg-black/30 border border-amber-500/20 p-6">
            <h3 className="text-amber-500/80 font-mono text-xs tracking-widest mb-4">
              ☉ INITIATE IDENTITY
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-amber-500/60 text-sm mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.targetName}
                  onChange={(e) => setForm({ ...form, targetName: e.target.value })}
                  className="w-full bg-black/50 border border-amber-500/30 text-amber-200 p-3 focus:border-amber-500 focus:outline-none"
                  placeholder="Their true name"
                  required
                />
              </div>
              <div>
                <label className="block text-amber-500/60 text-sm mb-1">
                  Order Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.proposedTitle}
                  onChange={(e) => setForm({ ...form, proposedTitle: e.target.value })}
                  className="w-full bg-black/50 border border-amber-500/30 text-amber-200 p-3 focus:border-amber-500 focus:outline-none"
                  placeholder="e.g., Keeper of the Eastern Flame"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-amber-500/60 text-sm mb-1">Role</label>
                  <select
                    value={form.proposedRole}
                    onChange={(e) => setForm({ ...form, proposedRole: e.target.value })}
                    className="w-full bg-black/50 border border-amber-500/30 text-amber-200 p-3 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="aspirant">Aspirant</option>
                    <option value="initiate">Initiate</option>
                    <option value="keeper">Keeper</option>
                    <option value="sovereign">Sovereign</option>
                  </select>
                </div>
                <div>
                  <label className="block text-amber-500/60 text-sm mb-1">Personal Sigil</label>
                  <input
                    type="text"
                    value={form.proposedSignil}
                    onChange={(e) => setForm({ ...form, proposedSignil: e.target.value })}
                    className="w-full bg-black/50 border border-amber-500/30 text-amber-200 p-3 focus:border-amber-500 focus:outline-none"
                    placeholder="⬡"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/30 border border-amber-500/20 p-6">
            <h3 className="text-amber-500/80 font-mono text-xs tracking-widest mb-4">
              ◎ CEREMONIAL INVOCATION
            </h3>
            <div>
              <label className="block text-amber-500/60 text-sm mb-1">
                Personal Message (Optional)
              </label>
              <textarea
                value={form.invocationText}
                onChange={(e) => setForm({ ...form, invocationText: e.target.value })}
                className="w-full bg-black/50 border border-amber-500/30 text-amber-200 p-3 focus:border-amber-500 focus:outline-none min-h-[120px]"
                placeholder="A personal invocation that will be revealed during the ceremony..."
              />
            </div>
          </div>

          <div className="bg-black/30 border border-amber-500/20 p-6">
            <h3 className="text-amber-500/80 font-mono text-xs tracking-widest mb-4">
              ⏳ EXPIRATION
            </h3>
            <div>
              <label className="block text-amber-500/60 text-sm mb-1">
                Days until expiration
              </label>
              <select
                value={form.expiresInDays}
                onChange={(e) => setForm({ ...form, expiresInDays: Number(e.target.value) })}
                className="w-full bg-black/50 border border-amber-500/30 text-amber-200 p-3 focus:border-amber-500 focus:outline-none"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-amber-500 text-black hover:bg-amber-400 transition-all font-mono tracking-widest disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙</span>
                  PREPARING SUMMONS...
                </span>
              ) : (
                "CREATE SACRED SUMMONS"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
