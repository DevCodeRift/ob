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
  memberName: string | null;
  memberDiscord: string | null;
  sortOrder: number;
}

const CLEARANCE_NAMES: Record<string, string> = {
  ouroboros_sovereign: "Ouroboros Sovereign (CL5)",
  ophidian_apex: "Ophidian Apex (CL2)",
  venom_circle: "Venom Circle (CL1)",
  scale_bearer: "Scale Bearer (CL0)",
  outer_coil: "Outer Coil",
};

export default function InvitationsPage() {
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
        setSeats(data.seats.filter((s: SerpentiusSeat) => s.memberName));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/covenant"
            className="text-stone-500 hover:text-stone-700 text-sm mb-4 inline-block"
          >
            ← Back to Covenant
          </Link>
          <h1 className="text-3xl font-serif text-stone-800 mb-2">Ordo Serpentius</h1>
          <p className="text-stone-600">Official Invitations</p>
        </div>

        {/* Member Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 mb-8">
          <h2 className="text-lg font-medium text-stone-800 mb-4">Select Member to Generate Invitation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {seats.map((seat) => (
              <button
                key={seat.id}
                onClick={() => setSelectedSeat(seat)}
                className={`p-3 text-left border rounded-lg transition-all ${
                  selectedSeat?.id === seat.id
                    ? "border-amber-500 bg-amber-50"
                    : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                <p className="font-medium text-stone-800">{seat.memberName}</p>
                <p className="text-sm text-stone-500">{seat.serpentTitle}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Generated Invitation */}
        {selectedSeat && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-stone-800">Preview</h2>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-stone-700 transition-colors text-sm"
              >
                Print Invitation
              </button>
            </div>

            {/* Printable Invitation */}
            <div id="invitation" className="bg-white border-2 border-stone-300 p-12 shadow-lg print:shadow-none print:border-stone-400">
              {/* Decorative Border */}
              <div className="border-2 border-amber-600 p-8 relative">
                {/* Corner Ornaments */}
                <div className="absolute top-2 left-2 text-amber-600 text-2xl">◈</div>
                <div className="absolute top-2 right-2 text-amber-600 text-2xl">◈</div>
                <div className="absolute bottom-2 left-2 text-amber-600 text-2xl">◈</div>
                <div className="absolute bottom-2 right-2 text-amber-600 text-2xl">◈</div>

                {/* Header */}
                <div className="text-center mb-8">
                  <div className="text-4xl text-amber-600 mb-2">◎</div>
                  <h1 className="font-serif text-3xl text-stone-800 tracking-wide mb-1">
                    ORDO SERPENTIUS
                  </h1>
                  <div className="w-32 h-0.5 bg-amber-600 mx-auto my-3" />
                  <p className="text-stone-500 text-sm tracking-widest uppercase">
                    Official Summons
                  </p>
                </div>

                {/* Body */}
                <div className="text-center space-y-6 mb-8">
                  <p className="text-stone-600 text-lg">
                    By decree of the Inner Council, you are hereby summoned to assume your rightful place within the Order.
                  </p>

                  <div className="py-6">
                    <p className="text-stone-500 text-sm uppercase tracking-wider mb-2">Bestowed Upon</p>
                    <p className="font-serif text-3xl text-stone-800">{selectedSeat.memberName}</p>
                  </div>

                  <div className="py-4 border-t border-b border-stone-200">
                    <p className="text-stone-500 text-sm uppercase tracking-wider mb-2">As</p>
                    <p className="font-serif text-2xl text-amber-700">{selectedSeat.serpentTitle}</p>
                    <p className="text-stone-600 mt-1">{selectedSeat.position}</p>
                  </div>

                  <div className="py-4">
                    <p className="text-stone-500 text-sm uppercase tracking-wider mb-2">Clearance Level</p>
                    <p className="font-medium text-stone-700">{CLEARANCE_NAMES[selectedSeat.clearance]}</p>
                  </div>
                </div>

                {/* Oath */}
                <div className="text-center mb-8 px-8">
                  <p className="text-stone-500 italic text-sm">
                    "As the serpent devours its tail, so shall we serve eternally."
                  </p>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end pt-8 border-t border-stone-200">
                  <div className="text-left">
                    <div className="w-40 border-b border-stone-400 mb-1" />
                    <p className="text-xs text-stone-500">Keeper of the Ouroboros</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl text-amber-600 mb-1">⛧</div>
                    <p className="text-xs text-stone-500">Official Seal</p>
                  </div>
                  <div className="text-right">
                    <div className="w-40 border-b border-stone-400 mb-1" />
                    <p className="text-xs text-stone-500">Date of Induction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invitation, #invitation * {
            visibility: visible;
          }
          #invitation {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
