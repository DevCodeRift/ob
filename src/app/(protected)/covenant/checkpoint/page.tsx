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
  sortOrder: number;
}

const CLEARANCE_CONFIG: Record<string, { name: string; color: string; bgColor: string; level: string }> = {
  ouroboros_sovereign: { name: "SOVEREIGN", color: "#9333ea", bgColor: "#f3e8ff", level: "CL5" },
  ophidian_apex: { name: "APEX", color: "#b8860b", bgColor: "#fef3c7", level: "CL2" },
  venom_circle: { name: "VENOM", color: "#92400e", bgColor: "#fef3c7", level: "CL1" },
  scale_bearer: { name: "SCALE", color: "#78350f", bgColor: "#f5f5f4", level: "CL0" },
  outer_coil: { name: "OUTER", color: "#57534e", bgColor: "#f5f5f4", level: "—" },
};

export default function CheckpointPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seats, setSeats] = useState<SerpentiusSeat[]>([]);
  const [loading, setLoading] = useState(true);

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

  const seatsByTier = {
    ouroboros_sovereign: seats.filter(s => s.clearance === "ouroboros_sovereign"),
    ophidian_apex: seats.filter(s => s.clearance === "ophidian_apex"),
    venom_circle: seats.filter(s => s.clearance === "venom_circle"),
    scale_bearer: seats.filter(s => s.clearance === "scale_bearer"),
    outer_coil: seats.filter(s => s.clearance === "outer_coil"),
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8 print:p-4 print:bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header - Hidden on print */}
        <div className="mb-6 text-center print:hidden">
          <Link
            href="/covenant"
            className="text-stone-500 hover:text-stone-700 text-sm mb-4 inline-block"
          >
            ← Back to Covenant
          </Link>
          <h1 className="text-2xl font-medium text-stone-800 mb-2">Guard Checkpoint Verification</h1>
          <p className="text-stone-500 text-sm mb-4">Authorized personnel identification roster</p>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-stone-700 transition-colors text-sm"
          >
            Print Roster
          </button>
        </div>

        {/* Printable Document */}
        <div id="checkpoint-roster" className="bg-white border border-stone-300 print:border-none">
          {/* Document Header */}
          <div className="bg-stone-800 text-white px-6 py-4 print:bg-stone-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">◎</span>
                <div>
                  <h1 className="font-semibold tracking-wide">ORDO SERPENTIUS</h1>
                  <p className="text-stone-300 text-xs">SECURITY CHECKPOINT ROSTER</p>
                </div>
              </div>
              <div className="text-right text-xs text-stone-400">
                <p>CLASSIFIED</p>
                <p>FOR GUARD USE ONLY</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
            <strong>VERIFICATION PROTOCOL:</strong> Confirm identity against this roster.
            Clearance level determines access areas. Report any discrepancies immediately.
          </div>

          {/* Roster Content */}
          <div className="p-6">
            {(["ouroboros_sovereign", "ophidian_apex", "venom_circle", "scale_bearer", "outer_coil"] as const).map((tierKey) => {
              const tier = CLEARANCE_CONFIG[tierKey];
              const tierSeats = seatsByTier[tierKey];
              if (tierSeats.length === 0) return null;

              return (
                <div key={tierKey} className="mb-6 last:mb-0">
                  {/* Tier Header */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 mb-3 border-l-4"
                    style={{ borderColor: tier.color, backgroundColor: tier.bgColor }}
                  >
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: tier.color, color: 'white' }}
                    >
                      {tier.name}
                    </span>
                    <span className="text-stone-600 text-sm font-medium">
                      {tier.level} Clearance
                    </span>
                  </div>

                  {/* Members Table */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200">
                        <th className="text-left py-2 px-3 text-stone-500 font-medium w-1/3">NAME</th>
                        <th className="text-left py-2 px-3 text-stone-500 font-medium w-1/3">DESIGNATION</th>
                        <th className="text-left py-2 px-3 text-stone-500 font-medium w-1/3">POSITION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tierSeats.map((seat, idx) => (
                        <tr
                          key={seat.id}
                          className={idx % 2 === 0 ? "bg-stone-50" : "bg-white"}
                        >
                          <td className="py-2.5 px-3 font-medium text-stone-800">
                            {seat.memberName}
                          </td>
                          <td className="py-2.5 px-3 text-stone-600 italic">
                            {seat.serpentTitle}
                          </td>
                          <td className="py-2.5 px-3 text-stone-600">
                            {seat.position}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-stone-100 border-t border-stone-200 flex justify-between items-center text-xs text-stone-500">
            <div>
              <p>Total Authorized: <strong className="text-stone-700">{seats.length}</strong></p>
            </div>
            <div className="text-center">
              <p>Document valid until revoked</p>
            </div>
            <div className="text-right">
              <p>Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Quick Reference Card - For printing separately */}
        <div className="mt-8 print:mt-4 print:break-before-page">
          <h2 className="text-lg font-medium text-stone-800 mb-4 print:hidden">Quick Reference Cards</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2">
            {seats.map((seat) => {
              const tier = CLEARANCE_CONFIG[seat.clearance];
              return (
                <div
                  key={seat.id}
                  className="border border-stone-300 bg-white p-3 print:p-2"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-lg">{seat.symbol}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: tier.color, color: 'white' }}
                    >
                      {tier.name}
                    </span>
                  </div>
                  <p className="font-semibold text-stone-800 text-sm leading-tight">
                    {seat.memberName}
                  </p>
                  <p className="text-stone-500 text-xs mt-1">{seat.serpentTitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
