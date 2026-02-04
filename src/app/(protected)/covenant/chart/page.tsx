"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SerpentiusSeat {
  id: string;
  seatId: string;
  position: string;
  serpentTitle: string;
  clearance: string;
  symbol: string;
  duties: string;
  memberName: string | null;
  memberDiscord: string | null;
  memberImage: string | null;
  sortOrder: number;
}

type ClearanceTier = "ouroboros_sovereign" | "ophidian_apex" | "venom_circle" | "scale_bearer" | "outer_coil";

const TIER_CONFIG: Record<ClearanceTier, { name: string; color: string; bgColor: string; borderColor: string; textColor: string; level: string }> = {
  ouroboros_sovereign: {
    name: "Ouroboros Sovereign",
    color: "#9333ea",
    bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
    borderColor: "border-purple-400",
    textColor: "text-purple-800",
    level: "CL5",
  },
  ophidian_apex: {
    name: "Ophidian Apex",
    color: "#d97706",
    bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
    borderColor: "border-amber-400",
    textColor: "text-amber-800",
    level: "CL2",
  },
  venom_circle: {
    name: "Venom Circle",
    color: "#b45309",
    bgColor: "bg-gradient-to-br from-orange-50 to-amber-50",
    borderColor: "border-amber-300",
    textColor: "text-amber-700",
    level: "CL1",
  },
  scale_bearer: {
    name: "Scale Bearer",
    color: "#92400e",
    bgColor: "bg-gradient-to-br from-stone-50 to-stone-100",
    borderColor: "border-stone-300",
    textColor: "text-stone-700",
    level: "CL0",
  },
  outer_coil: {
    name: "Outer Coil",
    color: "#78716c",
    bgColor: "bg-gradient-to-br from-stone-100 to-stone-150",
    borderColor: "border-stone-400",
    textColor: "text-stone-600",
    level: "—",
  },
};

export default function ChartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seats, setSeats] = useState<SerpentiusSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<SerpentiusSeat | null>(null);

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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-amber-600 mb-3 animate-pulse">◎</div>
          <p className="text-stone-500">Loading organization chart...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-50">
      {/* Navigation */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href="/covenant"
            className="text-stone-500 hover:text-stone-700 text-sm flex items-center gap-2"
          >
            <span>←</span> Back to Covenant
          </Link>
          <div className="flex gap-2">
            <Link
              href="/covenant/invitations"
              className="px-3 py-1.5 text-sm border border-stone-300 rounded hover:bg-stone-50 text-stone-600"
            >
              Invitations
            </Link>
            <Link
              href="/covenant/checkpoint"
              className="px-3 py-1.5 text-sm border border-stone-300 rounded hover:bg-stone-50 text-stone-600"
            >
              Guard Roster
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center py-12 px-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-300 mb-6">
          <span className="text-4xl text-amber-700">◎</span>
        </div>
        <h1 className="text-4xl font-serif text-stone-800 mb-2">Ordo Serpentius</h1>
        <p className="text-stone-500 tracking-wide">Organization Structure</p>
        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4" />
      </div>

      {/* Organization Chart */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        {/* Tier Legend */}
        <div className="flex justify-center gap-6 mb-12 flex-wrap">
          {(Object.keys(TIER_CONFIG) as ClearanceTier[]).map((tier) => (
            <div key={tier} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: TIER_CONFIG[tier].color }}
              />
              <span className="text-sm text-stone-600">{TIER_CONFIG[tier].name}</span>
            </div>
          ))}
        </div>

        {/* Tiers */}
        {(Object.keys(TIER_CONFIG) as ClearanceTier[]).map((tierKey, tierIndex) => {
          const tier = TIER_CONFIG[tierKey];
          const tierSeats = seatsByTier[tierKey];
          if (tierSeats.length === 0) return null;

          return (
            <div key={tierKey} className="mb-12 last:mb-0">
              {/* Tier Header */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-stone-300" />
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-stone-200 shadow-sm">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className={`text-sm font-medium ${tier.textColor}`}>
                    {tier.name}
                  </span>
                </div>
                <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-stone-300" />
              </div>

              {/* Connecting line from above */}
              {tierIndex > 0 && (
                <div className="flex justify-center -mt-6 mb-4">
                  <div className="w-px h-6 bg-stone-300" />
                </div>
              )}

              {/* Seats Grid */}
              <div className={`grid gap-4 ${
                tierKey === "ophidian_apex" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" :
                tierKey === "venom_circle" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" :
                tierKey === "scale_bearer" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
                "grid-cols-1 max-w-xs mx-auto"
              }`}>
                {tierSeats.map((seat) => (
                  <SeatCard
                    key={seat.id}
                    seat={seat}
                    tier={tier}
                    isSelected={selectedSeat?.id === seat.id}
                    onClick={() => setSelectedSeat(selectedSeat?.id === seat.id ? null : seat)}
                  />
                ))}
              </div>

              {/* Connecting line to below */}
              {tierIndex < Object.keys(TIER_CONFIG).length - 1 && seatsByTier[Object.keys(TIER_CONFIG)[tierIndex + 1] as ClearanceTier].length > 0 && (
                <div className="flex justify-center mt-4">
                  <div className="w-px h-8 bg-stone-300" />
                </div>
              )}
            </div>
          );
        })}

        {/* Stats Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-white rounded-lg border border-stone-200 shadow-sm">
            <div>
              <p className="text-2xl font-semibold text-stone-800">{seats.filter(s => s.memberName).length}</p>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Seated</p>
            </div>
            <div className="w-px h-10 bg-stone-200" />
            <div>
              <p className="text-2xl font-semibold text-stone-400">{seats.filter(s => !s.memberName).length}</p>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Vacant</p>
            </div>
            <div className="w-px h-10 bg-stone-200" />
            <div>
              <p className="text-2xl font-semibold text-stone-800">{seats.length}</p>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSeat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setSelectedSeat(null)}
        >
          <div
            className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`px-6 py-4 ${TIER_CONFIG[selectedSeat.clearance as ClearanceTier].bgColor}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-3xl mr-2">{selectedSeat.symbol}</span>
                </div>
                <button
                  onClick={() => setSelectedSeat(null)}
                  className="text-stone-400 hover:text-stone-600 text-xl"
                >
                  ×
                </button>
              </div>
              <h2 className={`text-xl font-serif mt-2 ${TIER_CONFIG[selectedSeat.clearance as ClearanceTier].textColor}`}>
                {selectedSeat.serpentTitle}
              </h2>
              <p className="text-stone-600 text-sm">{selectedSeat.position}</p>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              {/* Current Holder */}
              <div className="mb-4 pb-4 border-b border-stone-100">
                <p className="text-xs uppercase tracking-wider text-stone-400 mb-2">Current Holder</p>
                {selectedSeat.memberName ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center border border-amber-200">
                      {selectedSeat.memberImage ? (
                        <img src={selectedSeat.memberImage} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-amber-700 font-medium">{selectedSeat.memberName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">{selectedSeat.memberName}</p>
                      {selectedSeat.memberDiscord && (
                        <p className="text-sm text-stone-400">{selectedSeat.memberDiscord}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-400 italic">Position Vacant</p>
                )}
              </div>

              {/* Duties */}
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-400 mb-2">Duties</p>
                <p className="text-sm text-stone-600 leading-relaxed">{selectedSeat.duties}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-stone-50 border-t border-stone-100">
              <p className="text-xs text-stone-400 text-center">
                {TIER_CONFIG[selectedSeat.clearance as ClearanceTier].name} Clearance
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeatCard({
  seat,
  tier,
  isSelected,
  onClick,
}: {
  seat: SerpentiusSeat;
  tier: typeof TIER_CONFIG.ophidian_apex;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        ${tier.bgColor} border ${tier.borderColor} rounded-lg p-4 text-left
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${isSelected ? 'ring-2 ring-amber-400 shadow-md' : ''}
      `}
    >
      {/* Symbol & Title */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{seat.symbol}</span>
        {!seat.memberName && (
          <span className="text-[10px] px-1.5 py-0.5 bg-stone-200 text-stone-500 rounded">
            VACANT
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className={`font-serif text-sm ${tier.textColor} mb-0.5 leading-tight`}>
        {seat.serpentTitle}
      </h3>
      <p className="text-xs text-stone-500 mb-3 leading-tight">
        {seat.position}
      </p>

      {/* Member */}
      {seat.memberName ? (
        <div className="flex items-center gap-2 pt-2 border-t border-stone-200/50">
          <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-xs font-medium text-stone-600 border border-stone-200">
            {seat.memberImage ? (
              <img src={seat.memberImage} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              seat.memberName.charAt(0)
            )}
          </div>
          <span className="text-xs text-stone-700 truncate flex-1">{seat.memberName}</span>
        </div>
      ) : (
        <div className="pt-2 border-t border-stone-200/50">
          <span className="text-xs text-stone-400 italic">Awaiting appointment</span>
        </div>
      )}
    </button>
  );
}
