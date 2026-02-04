"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getClearanceInfo } from "@/lib/constants/clearance";

interface DivisionMembership {
  id: string;
  departmentId: string;
  departmentName: string;
  departmentIcon: string | null;
  departmentColor: string | null;
  rankId: string | null;
  rankName: string | null;
  rankShortName: string | null;
  rankClearance: number | null;
  assignedAt: string;
}

interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  email: string | null;
  title: string | null;
  designation: string | null;
  clearanceLevel: number;
  profileImage: string | null;
  bio: string | null;
  specializations: string[] | null;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  departmentId: string | null;
  departmentName: string | null;
  departmentIcon: string | null;
  departmentColor: string | null;
  projects: {
    id: string;
    projectCode: string;
    name: string;
    role: string;
    securityClass: string;
  }[];
  divisionMemberships: DivisionMembership[];
}

const ROLE_LABELS: Record<string, string> = {
  lead: "Project Lead",
  researcher: "Researcher",
  assistant: "Assistant",
  observer: "Observer",
};

export default function PersonnelProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = params.id as string;
  const isOwnProfile = session?.user?.id === userId;
  const isAdmin = (session?.user?.clearanceLevel ?? 0) >= 5;

  useEffect(() => {
    fetchUser();
  }, [userId]);

  async function fetchUser() {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        setUser(await res.json());
      } else {
        router.push("/personnel");
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
        <p className="font-mono text-muted animate-pulse">ACCESSING DOSSIER...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-danger mb-4">⚠</div>
        <p className="font-mono text-muted">PERSONNEL NOT FOUND</p>
        <Link href="/personnel" className="btn btn-secondary mt-4">
          RETURN TO DIRECTORY
        </Link>
      </div>
    );
  }

  const clearanceInfo = getClearanceInfo(user.clearanceLevel);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/personnel"
        className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-gold transition-colors"
      >
        ← RETURN TO DIRECTORY
      </Link>

      <div className="card-document overflow-hidden">
        <div
          className="h-2"
          style={{ backgroundColor: clearanceInfo.color }}
        />

        <div className="p-4 sm:p-6">
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <Link
                href={`/admin/users/${userId}`}
                className="btn btn-secondary text-sm"
              >
                &#9881; EDIT USER
              </Link>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl border-4"
              style={{
                borderColor: clearanceInfo.color,
                backgroundColor: clearanceInfo.color + "20",
              }}
            >
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span style={{ color: clearanceInfo.color }}>
                  {user.displayName.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl text-gold tracking-wide">
                  {user.displayName}
                </h1>
                {!user.isActive && (
                  <span className="badge badge-danger">INACTIVE</span>
                )}
              </div>

              {user.title && (
                <p className="font-body text-xl text-secondary">
                  {user.title}
                </p>
              )}

              {user.designation && (
                <p className="font-mono text-sm text-muted mt-1">
                  {user.designation}
                </p>
              )}

              {user.departmentName && (
                <div className="flex items-center gap-2 mt-3">
                  <span style={{ color: user.departmentColor || "#c9a227" }}>
                    {user.departmentIcon || "⛧"}
                  </span>
                  <span className="font-mono text-sm text-secondary">
                    {user.departmentName}
                  </span>
                </div>
              )}
            </div>

            <div className="text-center">
              <div
                className="inline-block px-6 py-4 border-2"
                style={{ borderColor: clearanceInfo.color }}
              >
                <span
                  className="font-display text-4xl"
                  style={{ color: clearanceInfo.color }}
                >
                  {user.clearanceLevel}
                </span>
              </div>
              <p
                className="font-mono text-xs tracking-widest mt-2"
                style={{ color: clearanceInfo.color }}
              >
                {clearanceInfo.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {user.bio && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  ☰ BIOGRAPHY
                </span>
              </div>
              <div className="p-5">
                <p className="font-body text-secondary whitespace-pre-wrap leading-relaxed">
                  {user.bio}
                </p>
              </div>
            </div>
          )}

          {user.projects && user.projects.length > 0 && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  ⬡ ASSIGNED PROJECTS
                </span>
              </div>
              <div className="divide-y divide-border-dark">
                {user.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-4 hover:bg-elevated transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-gold">
                          {project.projectCode}
                        </span>
                        <span className="font-mono text-secondary ml-2">
                          {project.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-muted">
                        {ROLE_LABELS[project.role] || project.role}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {user.divisionMemberships && user.divisionMemberships.length > 0 && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  ⚙ DIVISION AFFILIATIONS
                </span>
              </div>
              <div className="divide-y divide-border-dark">
                {user.divisionMemberships.map((membership) => (
                  <div key={membership.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xl"
                        style={{ color: membership.departmentColor || "#c9a227" }}
                      >
                        {membership.departmentIcon || "⛧"}
                      </span>
                      <div className="flex-1">
                        <p
                          className="font-mono text-sm"
                          style={{ color: membership.departmentColor || "#c9a227" }}
                        >
                          {membership.departmentName}
                        </p>
                        {membership.rankName && (
                          <p className="font-display text-secondary">
                            {membership.rankName}
                            <span className="font-mono text-xs text-muted ml-2">
                              (L{membership.rankClearance})
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.specializations && user.specializations.length > 0 && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  ◈ SPECIALIZATIONS
                </span>
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                {user.specializations.map((spec, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-elevated border border-border-dark font-mono text-xs text-secondary"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ◇ RECORD DATA
              </span>
            </div>
            <div className="p-5 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted">USERNAME</span>
                <span className="text-secondary">@{user.username}</span>
              </div>
              {user.email && (
                <div className="flex justify-between">
                  <span className="text-muted">EMAIL</span>
                  <span className="text-secondary">{user.email}</span>
                </div>
              )}
              {user.createdAt && (
                <div className="flex justify-between">
                  <span className="text-muted">INDUCTED</span>
                  <span className="text-secondary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {user.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-muted">LAST SEEN</span>
                  <span className="text-secondary">
                    {new Date(user.lastLoginAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">STATUS</span>
                <span className={user.isActive ? "text-class-green" : "text-danger"}>
                  {user.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
