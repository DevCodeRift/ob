"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

interface SerpentiusSeat {
  id: string;
  seatId: string;
  position: string;
  serpentTitle: string;
  clearance: ClearanceTier;
  symbol: string;
  duties: string;
  obligations: string;
  userId: string | null;
  memberName: string | null;
  memberDiscord: string | null;
  memberImage: string | null;
  appointedAt: string | null;
  sortOrder: number;
}

type ClearanceTier = "ouroboros_sovereign" | "ophidian_apex" | "venom_circle" | "scale_bearer" | "outer_coil";

interface TierInfo {
  name: string;
  symbol: string;
  color: string;
  borderColor: string;
  bgGlow: string;
  description: string;
  clearanceLevel: string;
}

const CLEARANCE_TIERS: Record<ClearanceTier, TierInfo> = {
  ouroboros_sovereign: {
    name: "Ouroboros Sovereign",
    symbol: "◎",
    color: "#9333ea",
    borderColor: "border-purple-500/50",
    bgGlow: "shadow-[0_0_40px_rgba(147,51,234,0.2)]",
    description: "Supreme Authority - Chairs the Council",
    clearanceLevel: "CL5",
  },
  ophidian_apex: {
    name: "Ophidian Apex",
    symbol: "◈",
    color: "#ffd700",
    borderColor: "border-yellow-500/50",
    bgGlow: "shadow-[0_0_30px_rgba(255,215,0,0.15)]",
    description: "Inner Circle - Full Operational Knowledge",
    clearanceLevel: "CL2",
  },
  venom_circle: {
    name: "Venom Circle",
    symbol: "◆",
    color: "#c9a227",
    borderColor: "border-amber-500/50",
    bgGlow: "shadow-[0_0_20px_rgba(201,162,39,0.1)]",
    description: "Operational Members - Significant Access",
    clearanceLevel: "CL1",
  },
  scale_bearer: {
    name: "Scale Bearer",
    symbol: "◇",
    color: "#b87333",
    borderColor: "border-orange-700/50",
    bgGlow: "shadow-[0_0_15px_rgba(184,115,51,0.1)]",
    description: "Aware of Existence - Need-to-Know Only",
    clearanceLevel: "CL0",
  },
  outer_coil: {
    name: "Outer Coil",
    symbol: "○",
    color: "#8b7355",
    borderColor: "border-stone-600/50",
    bgGlow: "",
    description: "Outside the Order - Aware but Excluded",
    clearanceLevel: "—",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function CovenantPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seats, setSeats] = useState<SerpentiusSeat[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);
  const [selectedSeat, setSelectedSeat] = useState<SerpentiusSeat | null>(null);
  const [editingSeat, setEditingSeat] = useState<SerpentiusSeat | null>(null);

  useEffect(() => {
    const newParticles = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 10,
      size: Math.random() * 2 + 1,
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/");
      return;
    }
    fetchSeats();
  }, [session, status, router]);

  async function fetchSeats() {
    try {
      const res = await fetch("/api/covenant/seats");
      if (res.ok) {
        const data = await res.json();
        setSeats(data.seats);
        setCanEdit(data.canEdit);
      } else {
        const data = await res.json();
        setError(data.error || "Access denied");
      }
    } catch (e) {
      setError("Failed to retrieve the council roster");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSeat(seatId: string, updates: { memberName: string; memberDiscord: string; memberImage: string }) {
    try {
      const res = await fetch("/api/covenant/seats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatId, ...updates }),
      });

      if (res.ok) {
        const data = await res.json();
        setSeats(prev => prev.map(s => s.seatId === seatId ? { ...s, ...data.seat } : s));
        setEditingSeat(null);
        // If we were viewing this seat, update the view too
        if (selectedSeat?.seatId === seatId) {
          setSelectedSeat(prev => prev ? { ...prev, ...data.seat } : null);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update assignment");
      }
    } catch (e) {
      alert("Failed to update assignment");
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-amber-500 animate-pulse mb-4">⛧</div>
          <p className="text-amber-500/60 font-mono text-sm tracking-widest animate-pulse">
            COMMUNING WITH THE ORDER...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <div className="text-6xl text-red-600 mb-6">⚠</div>
          <h1 className="font-display text-2xl text-red-500 mb-4">Access Forbidden</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <Link href="/dashboard" className="text-amber-500 hover:text-amber-400 transition-colors">
            Return to Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  const seatsByTier = {
    ouroboros_sovereign: seats.filter(s => s.clearance === "ouroboros_sovereign"),
    ophidian_apex: seats.filter(s => s.clearance === "ophidian_apex"),
    venom_circle: seats.filter(s => s.clearance === "venom_circle"),
    scale_bearer: seats.filter(s => s.clearance === "scale_bearer"),
    outer_coil: seats.filter(s => s.clearance === "outer_coil"),
  };

  const filledSeats = seats.filter(s => s.memberName).length;

  return (
    <div className="min-h-screen bg-void relative overflow-hidden">
      {/* Animated particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="fixed w-px bg-amber-500/20 rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            height: `${p.size}px`,
            width: `${p.size}px`,
            animation: `covenantFloat ${8 + p.delay}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Radial gradient overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/dashboard"
            className="inline-block font-mono text-xs text-amber-500/50 hover:text-amber-500 mb-4 transition-colors"
          >
            ← RETURN TO THE MORTAL REALM
          </Link>
          <div className="text-8xl text-amber-500 mb-4 animate-breathe">⛧</div>
          <h1 className="font-display text-4xl md:text-5xl text-amber-500 tracking-[0.2em] mb-2">
            ORDO SERPENTIUS
          </h1>
          <div className="w-64 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto my-6" />
          <p className="text-amber-500/60 italic text-lg">
            &ldquo;As the serpent devours its tail, so shall we serve eternally.&rdquo;
          </p>
          <p className="text-amber-500/40 font-mono text-xs mt-4 tracking-widest">
            THE SHADOW COUNCIL OF THE REALM
          </p>
          {canEdit && (
            <p className="text-green-500/60 font-mono text-xs mt-2 tracking-widest">
              ◈ ARCHMAGOS EDITING PRIVILEGES ACTIVE ◈
            </p>
          )}
        </div>

        {/* Round Table Visualization */}
        <div className="mb-16">
          <div className="relative max-w-4xl mx-auto">
            {/* Central emblem */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-2 border-amber-500/50 flex items-center justify-center bg-black/80 shadow-[0_0_50px_rgba(255,215,0,0.2)]">
                  <span className="text-5xl text-amber-500 animate-breathe">◎</span>
                </div>
                <div className="absolute inset-0 rounded-full border border-amber-500/20" style={{ animation: 'spin 30s linear infinite' }} />
                <div className="absolute -inset-4 rounded-full border border-amber-500/10" style={{ animation: 'spin 45s linear infinite reverse' }} />
              </div>
            </div>

            {/* Connecting lines (decorative) */}
            <div className="absolute top-16 left-1/2 w-px h-16 bg-gradient-to-b from-amber-500/50 to-transparent -translate-x-1/2" />
          </div>
        </div>

        {/* Clearance Tiers */}
        {(Object.keys(CLEARANCE_TIERS) as ClearanceTier[]).map((tierKey) => {
          const tier = CLEARANCE_TIERS[tierKey];
          const tierSeats = seatsByTier[tierKey];
          if (tierSeats.length === 0) return null;

          return (
            <div key={tierKey} className="mb-12">
              {/* Tier Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, ${tier.color}40)` }} />
                <div className="flex items-center gap-3 px-4 py-2 border bg-black/60" style={{ borderColor: `${tier.color}50` }}>
                  <span className="text-2xl" style={{ color: tier.color }}>{tier.symbol}</span>
                  <div className="text-center">
                    <h2 className="font-display text-lg tracking-widest" style={{ color: tier.color }}>
                      {tier.name.toUpperCase()}
                    </h2>
                    <p className="text-xs text-gray-500 font-mono">{tier.description}</p>
                  </div>
                  <span className="text-2xl" style={{ color: tier.color }}>{tier.symbol}</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent" style={{ backgroundImage: `linear-gradient(to left, transparent, ${tier.color}40)` }} />
              </div>

              {/* Seat Cards */}
              <div className={`grid gap-4 ${
                tierKey === "ophidian_apex" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" :
                tierKey === "venom_circle" ? "grid-cols-1 md:grid-cols-2" :
                "grid-cols-1 md:grid-cols-2"
              }`}>
                {tierSeats.map((seat) => (
                  <SeatCard
                    key={seat.id}
                    seat={seat}
                    tier={tier}
                    canEdit={canEdit}
                    isSelected={selectedSeat?.id === seat.id}
                    onSelect={() => setSelectedSeat(selectedSeat?.id === seat.id ? null : seat)}
                    onEdit={() => setEditingSeat(seat)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Selected Seat Detail Panel */}
        {selectedSeat && !editingSeat && (
          <DetailModal
            seat={selectedSeat}
            tier={CLEARANCE_TIERS[selectedSeat.clearance]}
            canEdit={canEdit}
            onClose={() => setSelectedSeat(null)}
            onEdit={() => setEditingSeat(selectedSeat)}
          />
        )}

        {/* Edit Modal */}
        {editingSeat && (
          <EditModal
            seat={editingSeat}
            onClose={() => setEditingSeat(null)}
            onSave={(updates) => handleSaveSeat(editingSeat.seatId, updates)}
          />
        )}

        {/* Footer */}
        <div className="text-center mt-16 pb-8">
          <div className="text-4xl text-amber-500/30 mb-4">◎</div>
          <p className="text-amber-500/40 font-mono text-xs tracking-widest">
            {filledSeats} OF {seats.length} SEATS FILLED
          </p>
          <p className="text-gray-600 font-mono text-xs mt-2">
            THE SERPENT COILS EVER TIGHTER
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes covenantFloat {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.1;
          }
          50% {
            transform: translateY(-30px) translateX(15px);
            opacity: 0.4;
          }
        }

        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.03);
            opacity: 0.9;
          }
        }

        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function SeatCard({
  seat,
  tier,
  canEdit,
  isSelected,
  onSelect,
  onEdit,
}: {
  seat: SerpentiusSeat;
  tier: TierInfo;
  canEdit: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`
        bg-black/60 border p-5 cursor-pointer transition-all duration-300
        hover:bg-black/80 group relative
        ${isSelected ? 'border-amber-500/70' : 'border-amber-500/20 hover:border-amber-500/40'}
        ${tier.bgGlow}
      `}
    >
      {/* Edit button for CL5+ */}
      {canEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border border-amber-500/30 bg-black/50 text-amber-500/50 hover:text-amber-500 hover:border-amber-500/60 transition-all opacity-0 group-hover:opacity-100"
          title="Edit Assignment"
        >
          ✎
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-14 h-14 flex items-center justify-center border bg-black/50 flex-shrink-0 transition-all group-hover:scale-105"
          style={{ borderColor: `${tier.color}50` }}
        >
          <span className="text-2xl">{seat.symbol}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg truncate" style={{ color: tier.color }}>
            {seat.serpentTitle}
          </h3>
          <p className="text-gray-400 text-sm">{seat.position}</p>
        </div>
      </div>

      {/* Member Info */}
      <div className="border-t border-amber-500/10 pt-4">
        {seat.memberName ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-amber-500/30 bg-black/50 flex items-center justify-center overflow-hidden">
              {seat.memberImage ? (
                <img src={seat.memberImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-amber-500/50">{seat.memberName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-amber-500/90 font-mono text-sm truncate">{seat.memberName}</p>
              {seat.memberDiscord && (
                <p className="text-gray-600 text-xs truncate">{seat.memberDiscord}</p>
              )}
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500/80 animate-pulse" title="Active" />
          </div>
        ) : (
          <div className="flex items-center gap-3 opacity-60">
            <div className="w-10 h-10 rounded-full border border-dashed border-amber-500/20 flex items-center justify-center">
              <span className="text-gray-600">?</span>
            </div>
            <p className="text-gray-600 font-mono text-sm italic">Awaiting Appointment</p>
          </div>
        )}
      </div>

      {/* Expand indicator */}
      <div className="text-center mt-4">
        <span className="text-amber-500/30 text-xs font-mono group-hover:text-amber-500/60 transition-colors">
          {isSelected ? '▲ COLLAPSE' : '▼ VIEW DUTIES'}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETAIL MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function DetailModal({
  seat,
  tier,
  canEdit,
  onClose,
  onEdit,
}: {
  seat: SerpentiusSeat;
  tier: TierInfo;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-w-2xl w-full bg-black border border-amber-500/30 p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs font-mono tracking-widest mb-1" style={{ color: tier.color }}>
              {tier.name.toUpperCase()}
            </p>
            <h2 className="text-2xl text-amber-500 font-display">{seat.serpentTitle}</h2>
            <p className="text-gray-400">{seat.position}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-amber-500 transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-amber-500/80 font-mono text-sm tracking-widest mb-2">⚙ DUTIES</h3>
            <p className="text-gray-300 leading-relaxed">{seat.duties}</p>
          </div>

          <div>
            <h3 className="text-amber-500/80 font-mono text-sm tracking-widest mb-2">⛧ OBLIGATIONS TO THE ORDER</h3>
            <p className="text-gray-300 leading-relaxed">{seat.obligations}</p>
          </div>

          <div className="border-t border-amber-500/20 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-amber-500/80 font-mono text-sm tracking-widest">◈ CURRENT HOLDER</h3>
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1 border border-amber-500/50 text-amber-500 text-xs font-mono hover:bg-amber-500/10 transition-colors"
                >
                  ✎ EDIT ASSIGNMENT
                </button>
              )}
            </div>
            {seat.memberName ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border border-amber-500/30 bg-black/50 flex items-center justify-center overflow-hidden">
                  {seat.memberImage ? (
                    <img src={seat.memberImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-amber-500/50">{seat.symbol}</span>
                  )}
                </div>
                <div>
                  <p className="text-amber-500 font-mono">{seat.memberName}</p>
                  {seat.memberDiscord && (
                    <p className="text-gray-500 text-sm">{seat.memberDiscord}</p>
                  )}
                  {seat.appointedAt && (
                    <p className="text-gray-600 text-xs mt-1">
                      Appointed {new Date(seat.appointedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 opacity-50">
                <div className="w-16 h-16 rounded-full border border-dashed border-amber-500/30 flex items-center justify-center">
                  <span className="text-2xl text-amber-500/30">?</span>
                </div>
                <div>
                  <p className="text-gray-500 font-mono italic">Position Vacant</p>
                  <p className="text-gray-600 text-sm">Awaiting appointment</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function EditModal({
  seat,
  onClose,
  onSave,
}: {
  seat: SerpentiusSeat;
  onClose: () => void;
  onSave: (updates: { memberName: string; memberDiscord: string; memberImage: string }) => void;
}) {
  const [memberName, setMemberName] = useState(seat.memberName || "");
  const [memberDiscord, setMemberDiscord] = useState(seat.memberDiscord || "");
  const [memberImage, setMemberImage] = useState(seat.memberImage || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ memberName, memberDiscord, memberImage });
    setSaving(false);
  };

  const handleClear = async () => {
    setSaving(true);
    await onSave({ memberName: "", memberDiscord: "", memberImage: "" });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-w-lg w-full bg-black border border-amber-500/50 p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs font-mono tracking-widest text-amber-500/60 mb-1">EDIT ASSIGNMENT</p>
            <h2 className="text-xl text-amber-500 font-display">{seat.serpentTitle}</h2>
            <p className="text-gray-500 text-sm">{seat.position}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-amber-500 transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-amber-500/80 font-mono text-xs tracking-widest mb-2">
              MEMBER NAME
            </label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Enter display name..."
              className="w-full bg-black/50 border border-amber-500/30 px-4 py-3 text-amber-500 font-mono placeholder-gray-600 focus:border-amber-500/60 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-amber-500/80 font-mono text-xs tracking-widest mb-2">
              DISCORD HANDLE
            </label>
            <input
              type="text"
              value={memberDiscord}
              onChange={(e) => setMemberDiscord(e.target.value)}
              placeholder="@username"
              className="w-full bg-black/50 border border-amber-500/30 px-4 py-3 text-amber-500 font-mono placeholder-gray-600 focus:border-amber-500/60 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-amber-500/80 font-mono text-xs tracking-widest mb-2">
              PROFILE IMAGE URL
            </label>
            <input
              type="text"
              value={memberImage}
              onChange={(e) => setMemberImage(e.target.value)}
              placeholder="https://..."
              className="w-full bg-black/50 border border-amber-500/30 px-4 py-3 text-amber-500 font-mono placeholder-gray-600 focus:border-amber-500/60 focus:outline-none transition-colors"
            />
          </div>

          {memberImage && (
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full border border-amber-500/30 overflow-hidden">
                <img src={memberImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClear}
              disabled={saving}
              className="flex-1 px-4 py-3 border border-red-500/50 text-red-500 font-mono text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              VACATE SEAT
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 border border-amber-500/50 bg-amber-500/10 text-amber-500 font-mono text-sm hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              {saving ? "SAVING..." : "CONFIRM ASSIGNMENT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
