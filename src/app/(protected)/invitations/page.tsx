"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Invitation {
  id: string;
  token: string;
  displayName: string;
  title: string | null;
  clearanceLevel: number;
  departmentId: string | null;
  departmentName: string | null;
  departmentIcon: string | null;
  departmentColor: string | null;
  rankId: string | null;
  rankName: string | null;
  rankShortName: string | null;
  notes: string | null;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  createdByName: string;
  status: "active" | "used" | "expired";
}

interface Department {
  id: string;
  name: string;
  iconSymbol: string;
  color: string;
}

interface Rank {
  id: string;
  name: string;
  shortName: string | null;
  clearanceLevel: number;
  departmentId: string;
}

export default function InvitationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUsed, setShowUsed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [form, setForm] = useState({
    displayName: "",
    title: "",
    clearanceLevel: 1,
    departmentId: "",
    rankId: "",
    notes: "",
    expiresInDays: 7,
  });

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    if (clearance < 4) {
      router.push("/dashboard");
      return;
    }
    fetchInvitations();
    fetchDepartments();
    fetchRanks();
  }, [showUsed, clearance, router]);

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/departments?includeRanks=false");
      const data = await res.json();
      if (res.ok) {
        setDepartments(data);
      } else {
        console.error("Departments API error:", data);
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  }

  async function fetchRanks() {
    try {
      const res = await fetch("/api/ranks");
      const data = await res.json();
      if (res.ok) {
        setRanks(data);
      } else {
        console.error("Ranks API error:", data);
      }
    } catch (error) {
      console.error("Failed to fetch ranks:", error);
    }
  }

  async function fetchInvitations() {
    try {
      const params = new URLSearchParams();
      if (showUsed) params.append("showUsed", "true");

      const res = await fetch(`/api/invitations?${params}`);
      if (res.ok) {
        setInvitations(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createInvitation(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({
          displayName: "",
          title: "",
          clearanceLevel: 1,
          departmentId: "",
          rankId: "",
          notes: "",
          expiresInDays: 7,
        });
        setShowForm(false);
        fetchInvitations();
      }
    } catch (error) {
      console.error("Failed to create invitation:", error);
    } finally {
      setCreating(false);
    }
  }

  async function revokeInvitation(id: string) {
    if (!confirm("Revoke this invitation?")) return;

    try {
      const res = await fetch(`/api/invitations?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchInvitations();
      }
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  const maxClearance = clearance >= 5 ? 5 : clearance - 1;

  const availableRanks = ranks.filter((r) => r.departmentId === form.departmentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-gold tracking-wide">
            ◇ Invitations
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            MANAGE ACCESS INVITATIONS
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? "CANCEL" : "+ NEW INVITATION"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createInvitation} className="card-document">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              ◇ CREATE INVITATION
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  Display Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm({ ...form, displayName: e.target.value })
                  }
                  className="input"
                  placeholder="Pre-assigned name..."
                  required
                />
              </div>
              <div>
                <label className="form-label">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="Optional title..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Division</label>
                <select
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm({ ...form, departmentId: e.target.value, rankId: "" })
                  }
                  className="input"
                >
                  <option value="">— No Division —</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.iconSymbol} {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Rank</label>
                <select
                  value={form.rankId}
                  onChange={(e) =>
                    setForm({ ...form, rankId: e.target.value })
                  }
                  className="input"
                  disabled={!form.departmentId}
                >
                  <option value="">
                    {!form.departmentId
                      ? "— Select Division First —"
                      : availableRanks.length === 0
                      ? "— No Ranks Available —"
                      : "— No Rank —"}
                  </option>
                  {availableRanks.map((rank) => (
                    <option key={rank.id} value={rank.id}>
                      {rank.name} (L{rank.clearanceLevel})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Clearance Level</label>
                <select
                  value={form.clearanceLevel}
                  onChange={(e) =>
                    setForm({ ...form, clearanceLevel: parseInt(e.target.value) })
                  }
                  className="input"
                >
                  {[1, 2, 3, 4, 5]
                    .filter((l) => l <= maxClearance)
                    .map((l) => (
                      <option key={l} value={l}>
                        Level {l}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="form-label">Expires In</label>
                <select
                  value={form.expiresInDays}
                  onChange={(e) =>
                    setForm({ ...form, expiresInDays: parseInt(e.target.value) })
                  }
                  className="input"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Internal Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input"
                placeholder="Optional notes..."
              />
            </div>

            <button type="submit" disabled={creating} className="btn btn-primary">
              {creating ? "CREATING..." : "CREATE INVITATION"}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showUsed}
            onChange={(e) => setShowUsed(e.target.checked)}
            className="w-4 h-4 accent-gold"
          />
          <span className="font-mono text-sm text-secondary">Show used/expired</span>
        </label>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
          <p className="font-mono text-muted animate-pulse">LOADING...</p>
        </div>
      ) : invitations.length === 0 ? (
        <div className="card-document p-12 text-center">
          <div className="text-4xl text-gold-dim mb-4">◇</div>
          <p className="font-mono text-muted">NO INVITATIONS</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className={`card-document p-4 ${
                inv.status !== "active" ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg text-primary">
                      {inv.displayName}
                    </span>
                    {inv.title && (
                      <span className="font-mono text-sm text-secondary">
                        {inv.title}
                      </span>
                    )}
                    <span
                      className={`badge ${
                        inv.status === "active"
                          ? "badge-green"
                          : inv.status === "used"
                          ? "badge-gold"
                          : "badge-gray"
                      }`}
                    >
                      {inv.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2 font-mono text-xs text-muted">
                    <span>Level {inv.clearanceLevel}</span>
                    <span
                      className="flex items-center gap-1"
                      style={{ color: inv.departmentColor || undefined }}
                    >
                      {inv.departmentName ? (
                        <>
                          <span>{inv.departmentIcon}</span>
                          {inv.departmentName}
                          {inv.rankName && ` · ${inv.rankName}`}
                        </>
                      ) : (
                        <span className="text-muted">No Division</span>
                      )}
                    </span>
                    <span>Created by {inv.createdByName}</span>
                    <span>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>
                    {inv.notes && <span>Note: {inv.notes}</span>}
                  </div>
                </div>

                {inv.status === "active" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(inv.token)}
                      className="btn btn-secondary text-sm"
                    >
                      {copied === inv.token ? "✓ COPIED" : "COPY LINK"}
                    </button>
                    <button
                      onClick={() => revokeInvitation(inv.id)}
                      className="btn btn-secondary text-sm text-danger"
                    >
                      REVOKE
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
