"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getClearanceInfo } from "@/lib/constants/clearance";

interface Department {
  id: string;
  name: string;
  iconSymbol: string;
  color: string;
}

interface DivisionMembership {
  id: string;
  departmentId: string;
  departmentName: string;
  departmentIcon: string;
  departmentColor: string;
  rankId: string | null;
  rankName: string | null;
  rankShortName: string | null;
  rankClearance: number | null;
}

interface Rank {
  id: string;
  name: string;
  shortName: string | null;
  clearanceLevel: number;
  departmentId: string;
}

interface User {
  id: string;
  displayName: string;
  username: string;
  email: string | null;
  title: string | null;
  designation: string | null;
  clearanceLevel: number;
  primaryDepartmentId: string | null;
  departmentName: string | null;
  departmentIcon: string | null;
  departmentColor: string | null;
  profileImage: string | null;
  bio: string | null;
  specializations: string[] | null;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  divisionMemberships: DivisionMembership[];
}

export default function AdminUserEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    title: "",
    designation: "",
    clearanceLevel: 0,
    primaryDepartmentId: "",
    isActive: true,
    isVerified: false,
    password: "",
  });

  const [newMembership, setNewMembership] = useState({
    departmentId: "",
    rankId: "",
  });

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || clearance < 5) {
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [status, clearance, router, userId]);

  async function fetchData() {
    try {
      const [userRes, deptsRes, ranksRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch("/api/departments"),
        fetch("/api/ranks"),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        setFormData({
          displayName: userData.displayName || "",
          title: userData.title || "",
          designation: userData.designation || "",
          clearanceLevel: userData.clearanceLevel || 0,
          primaryDepartmentId: userData.departmentId || "",
          isActive: userData.isActive ?? true,
          isVerified: userData.isVerified ?? false,
          password: "",
        });
      } else {
        const errorData = await userRes.json().catch(() => ({}));
        setError(errorData.error || "Failed to load user");
      }

      if (deptsRes.ok) {
        setDepartments(await deptsRes.json());
      }

      if (ranksRes.ok) {
        setRanks(await ranksRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: Record<string, any> = {
        displayName: formData.displayName,
        title: formData.title || null,
        designation: formData.designation || null,
        clearanceLevel: formData.clearanceLevel,
        primaryDepartmentId: formData.primaryDepartmentId || null,
        isActive: formData.isActive,
        isVerified: formData.isVerified,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        setSuccess("User updated successfully");
        setFormData((prev) => ({ ...prev, password: "" }));
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update user");
      }
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMembership() {
    if (!newMembership.departmentId) return;

    try {
      const res = await fetch(`/api/users/${userId}/memberships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: newMembership.departmentId,
          rankId: newMembership.rankId || null,
        }),
      });

      if (res.ok) {
        setNewMembership({ departmentId: "", rankId: "" });
        fetchData();
        setSuccess("Division membership added");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add membership");
      }
    } catch (err) {
      setError("Failed to add membership");
    }
  }

  async function handleRemoveMembership(membershipId: string) {
    try {
      const res = await fetch(`/api/users/${userId}/memberships`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId }),
      });

      if (res.ok) {
        fetchData();
        setSuccess("Division membership removed");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to remove membership");
      }
    } catch (err) {
      setError("Failed to remove membership");
    }
  }

  const availableRanks = ranks.filter(
    (r) => r.departmentId === newMembership.departmentId
  );

  if (status === "loading" || loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-gold animate-spin-slow mb-4">&#9881;</div>
        <p className="font-mono text-muted animate-pulse">
          ACCESSING PERSONNEL RECORD...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-danger mb-4">⚠</div>
        <p className="font-mono text-muted">USER NOT FOUND</p>
        <Link href="/admin/users" className="btn btn-secondary mt-4">
          ← RETURN TO USER LIST
        </Link>
      </div>
    );
  }

  const clearanceInfo = getClearanceInfo(user.clearanceLevel);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-gold transition-colors mb-2"
        >
          ← RETURN TO USER LIST
        </Link>
        <h1 className="font-display text-2xl text-gold tracking-wide">
          ⚉ Edit User: {user.displayName}
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          @{user.username} · PERSONNEL RECORD MODIFICATION
        </p>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <span className="text-xl mr-3">⚠</span>
          <span className="font-mono text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="alert-banner alert-success">
          <span className="text-xl mr-3">✓</span>
          <span className="font-mono text-sm">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ◈ BASIC INFORMATION
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block font-mono text-xs text-muted mb-2">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs text-muted mb-2">
                    TITLE
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="input w-full"
                    placeholder="e.g., Senior Researcher"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted mb-2">
                    DESIGNATION
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    className="input w-full"
                    placeholder="e.g., Tech-Adept Epsilon-7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs text-muted mb-2">
                    CLEARANCE LEVEL
                  </label>
                  <select
                    value={formData.clearanceLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        clearanceLevel: parseInt(e.target.value),
                      })
                    }
                    className="input w-full"
                  >
                    <option value={0}>0 - Pending</option>
                    <option value={1}>1 - Initiate</option>
                    <option value={2}>2 - Acolyte</option>
                    <option value={3}>3 - Adept</option>
                    <option value={4}>4 - Magos</option>
                    <option value={5}>5 - Archmagos</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted mb-2">
                    PRIMARY DEPARTMENT
                  </label>
                  <select
                    value={formData.primaryDepartmentId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primaryDepartmentId: e.target.value,
                      })
                    }
                    className="input w-full"
                  >
                    <option value="">— None —</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.iconSymbol} {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ◇ STATUS FLAGS
              </span>
            </div>
            <div className="p-5 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-5 h-5 accent-gold"
                />
                <span className="font-mono text-sm text-primary">
                  Active Account
                </span>
                <span className="font-mono text-xs text-muted">
                  — User can log in and access system
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) =>
                    setFormData({ ...formData, isVerified: e.target.checked })
                  }
                  className="w-5 h-5 accent-gold"
                />
                <span className="font-mono text-sm text-primary">
                  Verified
                </span>
                <span className="font-mono text-xs text-muted">
                  — Identity confirmed
                </span>
              </label>
            </div>
          </div>

          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ⚡ PASSWORD RESET
              </span>
            </div>
            <div className="p-5">
              <label className="block font-mono text-xs text-muted mb-2">
                NEW PASSWORD (leave blank to keep current)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="input w-full"
                placeholder="Enter new password..."
              />
              <p className="font-mono text-xs text-muted mt-2">
                Only fill this if you need to reset the user's password.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary w-full"
          >
            {saving ? "SAVING..." : "⚙ SAVE CHANGES"}
          </button>
        </div>

        <div className="space-y-6">
          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ◉ CURRENT STATUS
              </span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between">
                <span className="font-mono text-xs text-muted">Clearance</span>
                <span
                  className="font-mono text-sm"
                  style={{ color: clearanceInfo.color }}
                >
                  Level {user.clearanceLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-muted">Status</span>
                <span
                  className={`font-mono text-sm ${
                    user.isActive ? "text-class-green" : "text-danger"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {user.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-muted">
                    Last Login
                  </span>
                  <span className="font-mono text-xs text-secondary">
                    {new Date(user.lastLoginAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ⛧ DIVISION AFFILIATIONS
              </span>
            </div>
            <div className="p-5 space-y-4">
              {user.divisionMemberships.length === 0 ? (
                <p className="font-mono text-xs text-muted text-center py-4">
                  No division affiliations
                </p>
              ) : (
                <div className="space-y-2">
                  {user.divisionMemberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="flex items-center justify-between p-3 border border-border-dark"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xl"
                          style={{ color: membership.departmentColor }}
                        >
                          {membership.departmentIcon}
                        </span>
                        <div>
                          <p
                            className="font-mono text-sm"
                            style={{ color: membership.departmentColor }}
                          >
                            {membership.departmentName}
                          </p>
                          {membership.rankName && (
                            <p className="font-mono text-xs text-muted">
                              {membership.rankName} (L{membership.rankClearance})
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMembership(membership.id)}
                        className="text-danger hover:text-danger-bright text-sm"
                        title="Remove membership"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border-dark pt-4 mt-4">
                <p className="font-mono text-xs text-gold mb-3">
                  + ADD DIVISION
                </p>
                <div className="space-y-2">
                  <select
                    value={newMembership.departmentId}
                    onChange={(e) =>
                      setNewMembership({
                        departmentId: e.target.value,
                        rankId: "",
                      })
                    }
                    className="input w-full text-sm"
                  >
                    <option value="">Select Division...</option>
                    {departments
                      .filter(
                        (d) =>
                          !user.divisionMemberships.some(
                            (m) => m.departmentId === d.id
                          )
                      )
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.iconSymbol} {dept.name}
                        </option>
                      ))}
                  </select>

                  {newMembership.departmentId && availableRanks.length > 0 && (
                    <select
                      value={newMembership.rankId}
                      onChange={(e) =>
                        setNewMembership({
                          ...newMembership,
                          rankId: e.target.value,
                        })
                      }
                      className="input w-full text-sm"
                    >
                      <option value="">Select Rank (optional)...</option>
                      {availableRanks.map((rank) => (
                        <option key={rank.id} value={rank.id}>
                          {rank.name} (L{rank.clearanceLevel})
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={handleAddMembership}
                    disabled={!newMembership.departmentId}
                    className="btn btn-secondary w-full text-sm"
                  >
                    ADD MEMBERSHIP
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/personnel/${userId}`}
            className="btn btn-secondary w-full text-center block"
          >
            VIEW PUBLIC PROFILE →
          </Link>
        </div>
      </div>

      <div className="text-center binary-decoration py-4">
        PERSONNEL MODIFICATION TERMINAL · OMNISSIAH PROTECTS
      </div>
    </div>
  );
}
