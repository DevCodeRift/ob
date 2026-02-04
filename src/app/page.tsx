"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const OCCULT_SYMBOLS = ['⛧', '☉', '☽', '⚙', '◎', '✧', '⌬', '⍟', '☿', '♄', '⚶', '⌘'];

const BOOT_MESSAGES = [
  { text: "INITIATING COGITATOR SYSTEMS...", delay: 0 },
  { text: "LOADING MACHINE SPIRIT PROTOCOLS...", delay: 400 },
  { text: "ESTABLISHING NOOSPHERIC LINK...", delay: 800 },
  { text: "VERIFYING SECURITY CLEARANCE...", delay: 1200 },
  { text: "AWAKENING THE WARDS...", delay: 1600 },
  { text: "CONNECTION ESTABLISHED", delay: 2000 },
];

function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    BOOT_MESSAGES.forEach((msg, index) => {
      setTimeout(() => {
        setVisibleLines(index + 1);
        if (index === BOOT_MESSAGES.length - 1) {
          setTimeout(() => {
            setComplete(true);
            setTimeout(onComplete, 500);
          }, 400);
        }
      }, msg.delay);
    });
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="terminal">
          <div className="terminal-header">
            <div className="terminal-dot active" />
            <span className="font-terminal text-xs text-gold-dim ml-2">
              OUROBOROS-COGITATOR-PRIME
            </span>
          </div>
          <div className="terminal-body min-h-[300px]">
            {BOOT_MESSAGES.slice(0, visibleLines).map((msg, index) => (
              <div key={index} className="terminal-line animate-fade-in">
                <span className="terminal-prompt">&gt;</span>
                <span className={index === visibleLines - 1 && !complete ? "animate-flicker" : ""}>
                  {msg.text}
                </span>
                {index === BOOT_MESSAGES.length - 1 && complete && (
                  <span className="text-class-green ml-2">[OK]</span>
                )}
              </div>
            ))}
            {!complete && visibleLines > 0 && (
              <div className="terminal-line">
                <span className="terminal-cursor" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 progress-bar">
          <div
            className="progress-bar-fill transition-all duration-500"
            style={{ width: `${(visibleLines / BOOT_MESSAGES.length) * 100}%` }}
          />
        </div>

        <p className="mt-6 text-center latin-phrase text-sm">
          Ex tenebris, scientia. Ex machina, salvatio.
        </p>
      </div>
    </div>
  );
}

function FloatingSymbols() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {OCCULT_SYMBOLS.map((symbol, index) => (
        <div
          key={index}
          className="absolute text-gold-dim animate-float"
          style={{
            left: `${(index * 17) % 100}%`,
            top: `${(index * 23) % 100}%`,
            fontSize: `${1.5 + (index % 3) * 0.5}rem`,
            animationDelay: `${index * 2}s`,
            animationDuration: `${20 + (index % 5) * 5}s`,
            opacity: 0.08 + (index % 3) * 0.02,
          }}
        >
          {symbol}
        </div>
      ))}
      <div
        className="absolute text-gold-dark opacity-[0.03] animate-spin-slow"
        style={{
          fontSize: '40rem',
          right: '-15%',
          top: '-20%',
        }}
      >
        ⚙
      </div>
      <div
        className="absolute text-gold-dark opacity-[0.02] animate-spin-reverse"
        style={{
          fontSize: '30rem',
          left: '-10%',
          bottom: '-15%',
        }}
      >
        ⚙
      </div>
    </div>
  );
}

function EffectsOverlay() {
  return (
    <>
      <div className="vignette-overlay" />
      <div className="scanlines-overlay" />
      <div className="scan-line" />
      <div className="noise-overlay" />
    </>
  );
}

function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowForm(true), 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("CONNECTION SEVERED - The machine spirit falters");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
      <div className={`w-full max-w-lg transition-all duration-1000 ${showForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="text-8xl text-gold animate-breathe text-glow-gold">
              ☉
            </div>
            <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '30s' }}>
              <span className="absolute text-gold-dim text-xl" style={{ top: '-10%', left: '50%', transform: 'translateX(-50%)' }}>⛧</span>
              <span className="absolute text-gold-dim text-xl" style={{ bottom: '-10%', left: '50%', transform: 'translateX(-50%)' }}>⛧</span>
              <span className="absolute text-gold-dim text-xl" style={{ left: '-10%', top: '50%', transform: 'translateY(-50%)' }}>⛧</span>
              <span className="absolute text-gold-dim text-xl" style={{ right: '-10%', top: '50%', transform: 'translateY(-50%)' }}>⛧</span>
            </div>
          </div>

          <h1 className="font-display text-4xl text-gold tracking-[0.2em] mb-3 text-glow-gold">
            OUROBOROS
          </h1>
          <h2 className="font-display text-xl text-gold-dim tracking-[0.3em] mb-4">
            FOUNDATION
          </h2>

          <div className="divider-gradient w-64 mx-auto mb-4" />

          <p className="font-terminal text-xs text-muted tracking-[0.3em]">
            INTERNAL OPERATIONS COGITATOR
          </p>

          <p className="font-terminal text-[0.65rem] text-dim tracking-widest mt-2">
            NODE: PRIME-ALPHA-7 | SECTOR: CLASSIFIED
          </p>
        </div>

        <div className="card-document relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse-glow" />

          <div className="bg-danger-dark/30 border-b border-danger-dark/50 px-5 py-3 flex items-center gap-3">
            <span className="text-danger animate-pulse">⚠</span>
            <span className="font-terminal text-[0.7rem] text-danger tracking-widest">
              RESTRICTED ACCESS TERMINAL - CLEARANCE REQUIRED
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="alert-banner alert-danger text-sm">
                <span className="font-terminal">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 font-terminal text-xs text-gold-dim tracking-widest">
                <span className="text-gold">◈</span>
                TERMINAL DESIGNATION
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input bg-void border-border-dark focus:border-gold-dim pl-10"
                  placeholder="Enter assigned designation..."
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dim">⌘</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 font-terminal text-xs text-gold-dim tracking-widest">
                <span className="text-gold">◈</span>
                ACCESS CIPHER
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input bg-void border-border-dark focus:border-gold-dim pl-10"
                  placeholder="Enter authentication cipher..."
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dim">⚿</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-4 tracking-[0.2em] text-sm relative overflow-hidden group disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <span className="animate-spin">⚙</span>
                    <span className="animate-pulse">AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span className="group-hover:animate-spin transition-transform">⛧</span>
                    INITIATE CONNECTION
                    <span className="group-hover:animate-spin transition-transform">⛧</span>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="bg-dark/50 border-t border-border-dark px-5 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-class-green animate-pulse" />
              <span className="font-terminal text-[0.65rem] text-dim">
                MACHINE SPIRIT: ACTIVE
              </span>
            </div>
            <span className="font-terminal text-[0.65rem] text-gold-dim">
              COGITATOR v2.0.7
            </span>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-8">
          <a href="/apply" className="group font-terminal text-xs text-muted hover:text-gold transition-all flex items-center gap-2">
            <span className="group-hover:animate-spin">◇</span>
            RECRUITMENT PROTOCOLS
          </a>
          <span className="text-border-medium">│</span>
          <a href="#" className="group font-terminal text-xs text-muted hover:text-gold transition-all flex items-center gap-2">
            <span className="group-hover:animate-spin">◇</span>
            TECHNICAL ASSISTANCE
          </a>
        </div>

        <div className="mt-10 text-center space-y-4">
          <p className="font-terminal text-[0.6rem] text-dim leading-relaxed max-w-md mx-auto tracking-wide">
            ⚠ WARNING: UNAUTHORIZED ACCESS IS PROHIBITED ⚠
          </p>
          <p className="font-terminal text-[0.55rem] text-ghost leading-relaxed max-w-md mx-auto">
            ALL CONNECTIONS ARE MONITORED AND RECORDED. VIOLATIONS WILL RESULT
            IN IMMEDIATE TERMINATION OF CLEARANCE AND MANDATORY RECONDITIONING.
          </p>
          <p className="latin-phrase text-xs mt-4">
            The serpent devours itself, and from its death, is reborn eternal.
          </p>
        </div>

        <div className="mt-8 text-center binary-decoration overflow-hidden">
          01001111 01010101 01010010 01001111 01000010 01001111 01010010 01001111 01010011
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [bootComplete, setBootComplete] = useState(false);
  const [skipBoot, setSkipBoot] = useState(false);

  useEffect(() => {
    const hasSeenBoot = sessionStorage.getItem('ouroboros-boot-seen');
    if (hasSeenBoot) {
      setSkipBoot(true);
      setBootComplete(true);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleBootComplete = () => {
    sessionStorage.setItem('ouroboros-boot-seen', 'true');
    setBootComplete(true);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
          <div className="font-terminal text-gold text-sm animate-pulse tracking-widest">
            AWAKENING MACHINE SPIRIT...
          </div>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="bg-void min-h-screen relative overflow-hidden">
      <FloatingSymbols />
      <EffectsOverlay />

      {!bootComplete && !skipBoot ? (
        <BootSequence onComplete={handleBootComplete} />
      ) : (
        <LoginForm />
      )}
    </div>
  );
}
