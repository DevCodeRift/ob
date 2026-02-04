"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface InvitationData {
  valid: boolean;
  targetName: string;
  proposedTitle: string;
  proposedRole: string;
  proposedSignil: string | null;
  invocationText: string | null;
  sovereignName: string;
  sovereignTitle: string | null;
  requiresCredentials: boolean;
}

type CeremonyStage =
  | "loading"
  | "reveal"
  | "invocation"
  | "oath"
  | "acceptance"
  | "complete"
  | "error";

export default function CovenantInitiationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [stage, setStage] = useState<CeremonyStage>("loading");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState("");
  const [motto, setMotto] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    validateInvitation();
  }, [token]);

  async function validateInvitation() {
    try {
      const res = await fetch(`/api/covenant/invitations/${token}`);
      if (res.ok) {
        const data = await res.json();
        setInvitation(data);
        setTimeout(() => setStage("reveal"), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Invalid summons");
        setStage("error");
      }
    } catch (e) {
      setError("The ancient wards prevent access");
      setStage("error");
    }
  }

  const advanceStage = useCallback(() => {
    const stages: CeremonyStage[] = ["reveal", "invocation", "oath", "acceptance"];
    const currentIndex = stages.indexOf(stage);
    if (currentIndex < stages.length - 1) {
      setStage(stages[currentIndex + 1]);
    }
  }, [stage]);

  async function acceptCovenant() {
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setError("Username can only contain lowercase letters, numbers, and underscores");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/covenant/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motto, username, password }),
      });

      if (res.ok) {
        setStage("complete");
      } else {
        const data = await res.json();
        setError(data.error || "The ritual has failed");
      }
    } catch (e) {
      setError("Connection to the void was severed");
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "error") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <div className="text-6xl text-red-600 mb-6 animate-pulse">⚠</div>
          <h1 className="font-display text-2xl text-red-500 mb-4">
            The Wards Reject You
          </h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <Link href="/" className="text-amber-500 hover:text-amber-400 transition-colors">
            Return to the mortal realm →
          </Link>
        </div>
      </div>
    );
  }

  if (stage === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-1 h-1 bg-amber-500/30 rounded-full animate-float"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        <div className="text-center z-10">
          <div className="text-8xl text-amber-500 animate-pulse mb-8">☉</div>
          <p className="text-amber-500/60 font-mono text-sm tracking-[0.5em] animate-pulse">
            THE ANCIENT SEALS ARE OPENING
          </p>
        </div>
      </div>
    );
  }

  if (stage === "complete") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-1 h-1 bg-amber-500/50 rounded-full animate-float"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        <div className="text-center z-10 max-w-2xl px-4 animate-fade-in">
          <div className="text-9xl text-amber-500 mb-8 animate-breathe">⛧</div>
          <h1 className="font-display text-4xl text-amber-500 tracking-wider mb-4">
            THE ORDER IS SEALED
          </h1>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto my-8" />
          <p className="text-2xl text-amber-200 mb-2">{invitation?.targetName}</p>
          <p className="text-amber-500/80 italic mb-8">{invitation?.proposedTitle}</p>
          <p className="text-gray-400 mb-12 leading-relaxed">
            You have taken the oath. Your name is inscribed in the eternal records.
            The Ordo Serpentius welcomes you, {getRoleTitle(invitation?.proposedRole)}.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-4 border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-all duration-500 font-mono tracking-widest"
          >
            ENTER THE SANCTUM
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1 h-1 bg-amber-500/20 rounded-full animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_70%)] pointer-events-none z-10" />

      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center p-4">

        {stage === "reveal" && (
          <div className="text-center max-w-3xl animate-fade-in">
            <div className="text-9xl text-amber-500 mb-8 animate-breathe">☉</div>
            <h1 className="font-display text-3xl md:text-5xl text-amber-500 tracking-wider mb-6">
              {invitation?.targetName}
            </h1>
            <div className="w-48 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto my-8" />
            <p className="text-xl text-gray-400 mb-4">You have been summoned by</p>
            <p className="text-2xl text-amber-300 mb-1">{invitation?.sovereignName}</p>
            {invitation?.sovereignTitle && (
              <p className="text-amber-500/60 italic mb-8">{invitation.sovereignTitle}</p>
            )}
            <p className="text-gray-500 mb-12">to take your place among</p>
            <h2 className="font-display text-4xl md:text-6xl text-amber-500 tracking-[0.2em] mb-12">
              ORDO SERPENTIUS
            </h2>
            <button
              onClick={advanceStage}
              className="px-8 py-4 border border-amber-500/50 text-amber-500 hover:border-amber-500 hover:bg-amber-500/10 transition-all duration-500 font-mono tracking-widest"
            >
              APPROACH THE ALTAR
            </button>
          </div>
        )}

        {stage === "invocation" && (
          <div className="text-center max-w-3xl animate-fade-in">
            <div className="text-6xl text-amber-500 mb-8">⛧</div>
            <h2 className="font-display text-2xl text-amber-500/80 tracking-widest mb-8">
              THE INVOCATION
            </h2>
            <div className="bg-black/50 border border-amber-500/30 p-8 md:p-12 mb-8">
              {invitation?.invocationText ? (
                <p className="text-xl text-amber-200 leading-relaxed italic">
                  &ldquo;{invitation.invocationText}&rdquo;
                </p>
              ) : (
                <p className="text-xl text-amber-200 leading-relaxed italic">
                  &ldquo;From the shadows you emerged, and to the shadows you shall return—but not as you were.
                  The scales shall bind you, the serpent shall guide you, and the eternal cycle shall
                  claim you as its own.&rdquo;
                </p>
              )}
            </div>
            <p className="text-gray-400 mb-4">You are offered the title of</p>
            <p className="text-3xl text-amber-500 font-display tracking-wider mb-2">
              {invitation?.proposedTitle}
            </p>
            <p className="text-amber-500/60 mb-12">
              as {getRoleTitle(invitation?.proposedRole)} of the Order
            </p>
            <button
              onClick={advanceStage}
              className="px-8 py-4 border border-amber-500/50 text-amber-500 hover:border-amber-500 hover:bg-amber-500/10 transition-all duration-500 font-mono tracking-widest"
            >
              I ACCEPT THIS CALLING
            </button>
          </div>
        )}

        {stage === "oath" && (
          <div className="text-center max-w-3xl animate-fade-in">
            <div className="text-6xl text-amber-500 mb-8">◎</div>
            <h2 className="font-display text-2xl text-amber-500/80 tracking-widest mb-8">
              THE OATH OF SCALES
            </h2>
            <div className="bg-black/50 border border-amber-500/30 p-8 md:p-12 mb-8 text-left">
              <p className="text-amber-200 leading-loose text-lg">
                <span className="text-amber-500">I,</span>{" "}
                <span className="text-amber-300">{invitation?.targetName}</span>,{" "}
                <span className="text-amber-500">do solemnly swear:</span>
              </p>
              <ul className="mt-6 space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-amber-500 mt-1">⬡</span>
                  <span>To guard the mysteries of the Order with my life and beyond</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-500 mt-1">⬡</span>
                  <span>To serve the eternal cycle of death and rebirth</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-500 mt-1">⬡</span>
                  <span>To stand with my brothers and sisters of the Scale</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-500 mt-1">⬡</span>
                  <span>To embrace the serpent&apos;s wisdom in all endeavors</span>
                </li>
              </ul>
              <p className="mt-8 text-amber-500 italic text-center">
                &ldquo;As the serpent devours its tail, so shall I serve eternally.&rdquo;
              </p>
            </div>
            <button
              onClick={advanceStage}
              className="px-8 py-4 border border-amber-500/50 text-amber-500 hover:border-amber-500 hover:bg-amber-500/10 transition-all duration-500 font-mono tracking-widest"
            >
              I SPEAK THE OATH
            </button>
          </div>
        )}

        {stage === "acceptance" && (
          <div className="text-center max-w-3xl animate-fade-in">
            <div className="text-6xl text-amber-500 mb-8 animate-pulse">⛧</div>
            <h2 className="font-display text-2xl text-amber-500/80 tracking-widest mb-8">
              SEAL YOUR OATH
            </h2>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 p-4 mb-8 text-red-400">
                {error}
              </div>
            )}

            <div className="bg-black/50 border border-amber-500/30 p-8 mb-6">
              <p className="text-amber-500/80 text-sm tracking-widest mb-6 text-center">
                CREATE YOUR SACRED CREDENTIALS
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-amber-500/60 text-sm mb-2 text-left">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="lowercase, no spaces"
                    className="w-full bg-black/50 border border-amber-500/30 text-amber-200 p-4 focus:border-amber-500 focus:outline-none transition-colors placeholder:text-amber-500/30"
                  />
                </div>
                <div>
                  <label className="block text-amber-500/60 text-sm mb-2 text-left">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-black/50 border border-amber-500/30 text-amber-200 p-4 focus:border-amber-500 focus:outline-none transition-colors placeholder:text-amber-500/30"
                  />
                </div>
                <div>
                  <label className="block text-amber-500/60 text-sm mb-2 text-left">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full bg-black/50 border border-amber-500/30 text-amber-200 p-4 focus:border-amber-500 focus:outline-none transition-colors placeholder:text-amber-500/30"
                  />
                </div>
              </div>
            </div>

            <div className="bg-black/50 border border-amber-500/30 p-8 mb-8">
              <label className="block text-amber-500/80 text-sm tracking-widest mb-4 text-left">
                YOUR PERSONAL MOTTO (OPTIONAL)
              </label>
              <input
                type="text"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="A phrase that defines your path..."
                className="w-full bg-black/50 border border-amber-500/30 text-amber-200 p-4 focus:border-amber-500 focus:outline-none transition-colors placeholder:text-amber-500/30"
              />
              <p className="text-gray-500 text-sm mt-2 text-left">
                This motto will be inscribed alongside your name in the Order's records
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={acceptCovenant}
                disabled={submitting}
                className="w-full px-8 py-4 bg-amber-500 text-black hover:bg-amber-400 transition-all duration-500 font-mono tracking-widest disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚙</span>
                    THE SEAL IS FORMING...
                  </span>
                ) : (
                  "SEAL THE OATH"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-500/5 to-transparent pointer-events-none z-10" />

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
        }

        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function getRoleTitle(role: string | undefined): string {
  switch (role) {
    case "sovereign":
      return "Sovereign";
    case "keeper":
      return "Keeper of Mysteries";
    case "initiate":
      return "Initiate";
    case "aspirant":
    default:
      return "Aspirant";
  }
}
