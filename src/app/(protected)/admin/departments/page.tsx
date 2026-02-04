"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Rank {
  id: string;
  name: string;
  shortName: string | null;
  clearanceLevel: number;
  sortOrder: number;
  description: string | null;
}

interface Department {
  id: string;
  name: string;
  codename: string | null;
  description: string | null;
  iconSymbol: string;
  color: string;
  isActive: boolean;
  ranks: Rank[];
}

export default function AdminDepartmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    if (clearance < 5) {
      router.push("/dashboard");
      return;
    }
    fetchDepartments();
  }, [clearance, router]);

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
        <p className="font-mono text-muted animate-pulse">
          ACCESSING DIVISION RECORDS...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-gold transition-colors mb-2"
          >
            ← RETURN TO ADMIN
          </Link>
          <h1 className="font-display text-2xl text-gold tracking-wide">
            ⛧ Divisions & Ranks
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            ORGANIZATIONAL STRUCTURE MANAGEMENT
          </p>
        </div>
      </div>

      <div className="alert-banner alert-info">
        <span className="text-xl mr-3">◎</span>
        <span className="font-mono text-sm">
          Divisions and ranks are seeded automatically. Contact system
          administrator to modify structure.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="card-document overflow-hidden">
            <div
              className="h-1"
              style={{ backgroundColor: dept.color }}
            />
            <div
              className="p-5 cursor-pointer hover:bg-elevated transition-colors"
              onClick={() =>
                setExpandedDept(expandedDept === dept.id ? null : dept.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span
                    className="text-4xl"
                    style={{ color: dept.color }}
                  >
                    {dept.iconSymbol}
                  </span>
                  <div>
                    <h2
                      className="font-display text-xl tracking-wide"
                      style={{ color: dept.color }}
                    >
                      {dept.name}
                    </h2>
                    {dept.codename && (
                      <p className="font-mono text-xs text-muted">
                        CODENAME: {dept.codename}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-2xl text-gold">
                    {dept.ranks?.length || 0}
                  </span>
                  <p className="font-mono text-xs text-muted">RANKS</p>
                </div>
              </div>
              {dept.description && (
                <p className="font-body text-sm text-secondary mt-3">
                  {dept.description}
                </p>
              )}
            </div>

            {expandedDept === dept.id && dept.ranks && (
              <div className="border-t border-border-dark">
                <div className="bg-dark px-5 py-3">
                  <span className="font-mono text-xs text-gold tracking-widest">
                    ◈ RANK HIERARCHY
                  </span>
                </div>
                <div className="divide-y divide-border-dark">
                  {dept.ranks
                    .sort((a, b) => b.sortOrder - a.sortOrder)
                    .map((rank, index) => (
                      <div
                        key={rank.id}
                        className="p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-8 h-8 flex items-center justify-center border font-mono text-sm"
                            style={{ borderColor: dept.color, color: dept.color }}
                          >
                            {rank.shortName || (index + 1)}
                          </div>
                          <div>
                            <p className="font-display text-secondary">
                              {rank.name}
                            </p>
                            {rank.description && (
                              <p className="font-mono text-xs text-muted">
                                {rank.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className="inline-block px-3 py-1 border font-mono text-sm"
                            style={{
                              borderColor: dept.color,
                              color: dept.color,
                            }}
                          >
                            L{rank.clearanceLevel}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card-document">
        <div className="bg-dark border-b border-border-dark px-5 py-3">
          <span className="font-mono text-xs text-gold tracking-widest">
            ◇ CLEARANCE LEVEL REFERENCE
          </span>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <ClearanceRef level={0} title="Pending" color="#606068" />
          <ClearanceRef level={1} title="Initiate" color="#4a5568" />
          <ClearanceRef level={2} title="Acolyte" color="#2a8a8a" />
          <ClearanceRef level={3} title="Adept" color="#b87333" />
          <ClearanceRef level={4} title="Magos" color="#c9a227" />
          <ClearanceRef level={5} title="Archmagos" color="#c42b2b" />
        </div>
      </div>

      <div className="text-center binary-decoration py-4">
        DIVISION REGISTRY · OMNISSIAH PROTECTS
      </div>
    </div>
  );
}

function ClearanceRef({
  level,
  title,
  color,
}: {
  level: number;
  title: string;
  color: string;
}) {
  return (
    <div className="text-center p-3 border border-border-dark">
      <span
        className="font-display text-2xl"
        style={{ color }}
      >
        {level}
      </span>
      <p className="font-mono text-xs text-muted mt-1">{title}</p>
    </div>
  );
}
