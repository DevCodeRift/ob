"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Application {
  id: string;
  discordHandle: string;
  email: string | null;
  proposedName: string;
  proposedTitle: string | null;
  username: string | null;
  requestedDepartmentId: string | null;
  requestedRankId: string | null;
  preferredDepartment: string | null;
  motivation: string | null;
  experience: string | null;
  referral: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  departmentName: string | null;
  departmentIcon: string | null;
  departmentColor: string | null;
  rankName: string | null;
  rankShortName: string | null;
  rankClearance: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "badge-gold",
  contacted: "badge-cyan",
  interviewing: "badge-brass",
  approved: "badge-green",
  rejected: "badge-danger",
  blacklisted: "badge-black",
};

export default function AdminApplicationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selected, setSelected] = useState<Application | null>(null);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    if (clearance < 4) {
      router.push("/dashboard");
      return;
    }
    fetchApplications();
  }, [statusFilter, clearance, router]);

  async function fetchApplications() {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/applications?${params}`);
      if (res.ok) {
        setApplications(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(true);
    setMessage("");
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setMessage(`Account created for ${data.user.username}. They can now log in.`);
        }
        setTimeout(() => {
          setSelected(null);
          setNotes("");
          setMessage("");
          fetchApplications();
        }, 2000);
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to update application:", error);
      setMessage("Error: Failed to update application");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="font-mono text-xs text-muted hover:text-gold"
          >
            ← ADMIN
          </Link>
          <h1 className="font-display text-2xl text-gold tracking-wide mt-2">
            ☲ Applications Review
          </h1>
        </div>
      </div>

      <div className="card-document p-4">
        <div className="flex gap-2 flex-wrap">
          {["pending", "contacted", "interviewing", "approved", "rejected"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 font-mono text-xs border transition-all ${
                  statusFilter === status
                    ? "border-gold text-gold"
                    : "border-border-dark text-muted hover:border-border-medium"
                }`}
              >
                {status.toUpperCase()}
              </button>
            )
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
          <p className="font-mono text-muted animate-pulse">LOADING...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="card-document p-12 text-center">
          <div className="text-4xl text-gold-dim mb-4">☲</div>
          <p className="font-mono text-muted">NO APPLICATIONS</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              onClick={() => {
                setSelected(app);
                setNotes(app.adminNotes || "");
                setMessage("");
              }}
              className={`card-document p-4 cursor-pointer transition-all ${
                selected?.id === app.id
                  ? "border-gold"
                  : "hover:border-border-medium"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-mono text-lg text-primary">
                    {app.proposedName}
                  </h3>
                  {app.proposedTitle && (
                    <p className="font-mono text-xs text-secondary">
                      {app.proposedTitle}
                    </p>
                  )}
                </div>
                <span className={`badge ${STATUS_COLORS[app.status]}`}>
                  {app.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-1 font-mono text-xs text-muted">
                {app.username && <p>Username: <span className="text-gold">{app.username}</span></p>}
                <p>Discord: {app.discordHandle}</p>
                {app.email && <p>Email: {app.email}</p>}
                {app.departmentName && (
                  <p>
                    <span style={{ color: app.departmentColor || undefined }}>
                      {app.departmentIcon} {app.departmentName}
                    </span>
                    {app.rankName && ` → ${app.rankName}`}
                  </p>
                )}
                <p>Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-void/90 flex items-center justify-center z-50 p-4">
          <div className="card-document max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="bg-dark border-b border-border-dark px-5 py-3 flex items-center justify-between sticky top-0">
              <span className="font-mono text-xs text-gold tracking-widest">
                APPLICATION REVIEW
              </span>
              <button
                onClick={() => {
                  setSelected(null);
                  setMessage("");
                }}
                className="text-muted hover:text-gold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {message && (
                <div className={`alert-banner ${message.startsWith("Error") ? "alert-danger" : "alert-success"}`}>
                  <span className="font-mono">{message}</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl text-gold">
                    {selected.proposedName}
                  </h2>
                  {selected.proposedTitle && (
                    <p className="font-body text-secondary">
                      {selected.proposedTitle}
                    </p>
                  )}
                </div>
                <span className={`badge ${STATUS_COLORS[selected.status]}`}>
                  {selected.status.toUpperCase()}
                </span>
              </div>

              {selected.username && (
                <div className="bg-dark border border-gold-dim/30 p-4">
                  <span className="font-mono text-xs text-gold-dim block mb-2">
                    ⚿ ACCOUNT CREDENTIALS
                  </span>
                  <div className="font-mono">
                    <span className="text-muted">Username: </span>
                    <span className="text-gold text-lg">{selected.username}</span>
                  </div>
                  <p className="font-mono text-xs text-muted mt-1">
                    Password set by applicant (stored securely)
                  </p>
                </div>
              )}

              {selected.departmentName && (
                <div className="bg-dark border border-border-dark p-4">
                  <span className="font-mono text-xs text-gold-dim block mb-2">
                    ⚙ REQUESTED ASSIGNMENT
                  </span>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-mono text-muted block text-xs">Department</span>
                      <span
                        className="font-mono text-lg"
                        style={{ color: selected.departmentColor || undefined }}
                      >
                        {selected.departmentIcon} {selected.departmentName}
                      </span>
                    </div>
                    {selected.rankName && (
                      <div>
                        <span className="font-mono text-muted block text-xs">Rank</span>
                        <span className="font-mono text-lg text-secondary">
                          {selected.rankName}
                          {selected.rankShortName && ` (${selected.rankShortName})`}
                        </span>
                        <span className="font-mono text-xs text-gold ml-2">
                          CL{selected.rankClearance}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                <div>
                  <span className="text-muted block">Discord</span>
                  <span className="text-secondary">{selected.discordHandle}</span>
                </div>
                <div>
                  <span className="text-muted block">Email</span>
                  <span className="text-secondary">{selected.email || "—"}</span>
                </div>
                <div>
                  <span className="text-muted block">Referral</span>
                  <span className="text-secondary">{selected.referral || "—"}</span>
                </div>
                <div>
                  <span className="text-muted block">Applied</span>
                  <span className="text-secondary">
                    {new Date(selected.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {selected.motivation && (
                <div>
                  <span className="font-mono text-xs text-muted block mb-1">
                    MOTIVATION
                  </span>
                  <p className="font-body text-secondary bg-dark p-3 border border-border-dark">
                    {selected.motivation}
                  </p>
                </div>
              )}

              {selected.experience && (
                <div>
                  <span className="font-mono text-xs text-muted block mb-1">
                    EXPERIENCE
                  </span>
                  <p className="font-body text-secondary bg-dark p-3 border border-border-dark">
                    {selected.experience}
                  </p>
                </div>
              )}

              <div>
                <label className="font-mono text-xs text-muted block mb-1">
                  ADMIN NOTES
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input w-full"
                  placeholder="Internal notes..."
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-border-dark">
                {selected.status === "pending" && (
                  <>
                    <button
                      onClick={() => updateStatus(selected.id, "contacted")}
                      disabled={updating}
                      className="btn btn-secondary"
                    >
                      MARK CONTACTED
                    </button>
                    <button
                      onClick={() => updateStatus(selected.id, "interviewing")}
                      disabled={updating}
                      className="btn btn-secondary"
                    >
                      INTERVIEWING
                    </button>
                  </>
                )}

                {["pending", "contacted", "interviewing"].includes(selected.status) && (
                  <>
                    <button
                      onClick={() => updateStatus(selected.id, "approved")}
                      disabled={updating || !selected.username}
                      className="btn btn-primary"
                      title={!selected.username ? "Application has no credentials" : "Approve and create account"}
                    >
                      {updating ? "CREATING..." : "APPROVE + CREATE ACCOUNT"}
                    </button>
                    <button
                      onClick={() => updateStatus(selected.id, "rejected")}
                      disabled={updating}
                      className="btn btn-secondary text-danger"
                    >
                      REJECT
                    </button>
                  </>
                )}

                <button
                  onClick={() => updateStatus(selected.id, selected.status)}
                  disabled={updating}
                  className="btn btn-secondary ml-auto"
                >
                  SAVE NOTES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
