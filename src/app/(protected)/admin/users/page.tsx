"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getClearanceInfo } from "@/lib/constants/clearance";

interface User {
  id: string;
  displayName: string;
  username: string;
  email?: string;
  title: string | null;
  designation: string | null;
  clearanceLevel: number;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  departmentName: string | null;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    if (clearance < 5) {
      router.push("/dashboard");
      return;
    }
    fetchUsers();
  }, [clearance, router]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

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
            ⚉ User Management
          </h1>
        </div>
      </div>

      <div className="card-document p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="input w-full"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
          <p className="font-mono text-muted animate-pulse">LOADING...</p>
        </div>
      ) : (
        <div className="card-document overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-dark border-b border-border-dark">
                <th className="px-4 py-3 text-left font-mono text-xs text-gold-dim">
                  USER
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs text-gold-dim">
                  CLEARANCE
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs text-gold-dim">
                  DEPARTMENT
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs text-gold-dim">
                  STATUS
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs text-gold-dim">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {filteredUsers.map((user) => {
                const clearanceInfo = getClearanceInfo(user.clearanceLevel);
                return (
                  <tr key={user.id} className="hover:bg-elevated transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-mono text-primary">
                          {user.displayName}
                        </span>
                        <span className="font-mono text-xs text-muted ml-2">
                          @{user.username}
                        </span>
                      </div>
                      {user.title && (
                        <div className="font-mono text-xs text-secondary">
                          {user.title}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-mono text-sm"
                        style={{ color: clearanceInfo.color }}
                      >
                        Level {user.clearanceLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-secondary">
                        {user.departmentName || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            user.isActive ? "bg-class-green" : "bg-danger"
                          }`}
                        />
                        <span className="font-mono text-xs text-muted">
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="btn btn-secondary text-xs"
                      >
                        EDIT
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
