"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getClearanceInfo } from "@/lib/constants/clearance";

interface User {
  id: string;
  displayName: string;
  username: string;
  title: string | null;
  designation: string | null;
  clearanceLevel: number;
  profileImage: string | null;
  bio: string | null;
  specializations: string[] | null;
  isActive: boolean;
  departmentName: string | null;
  departmentIcon: string | null;
  departmentColor: string | null;
}

interface Department {
  id: string;
  name: string;
  iconSymbol: string | null;
  color: string | null;
}

export default function PersonnelPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"clearance" | "department">("clearance");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/departments"),
      ]);

      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
      if (deptsRes.ok) {
        setDepartments(await deptsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.title?.toLowerCase().includes(search.toLowerCase()) ||
      u.departmentName?.toLowerCase().includes(search.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "all" ||
      (selectedDepartment === "none" && !u.departmentName) ||
      u.departmentName === departments.find(d => d.id === selectedDepartment)?.name;

    return matchesSearch && matchesDepartment;
  });

  const groupedByClearance = filteredUsers.reduce((acc, user) => {
    const level = user.clearanceLevel;
    if (!acc[level]) acc[level] = [];
    acc[level].push(user);
    return acc;
  }, {} as Record<number, User[]>);

  const sortedLevels = Object.keys(groupedByClearance)
    .map(Number)
    .sort((a, b) => b - a);

  const groupedByDepartment = filteredUsers.reduce((acc, user) => {
    const deptName = user.departmentName || "Unassigned";
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  const sortedDepartments = Object.keys(groupedByDepartment).sort((a, b) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-gold tracking-wide">
            &#9865; Personnel Directory
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            FOUNDATION OPERATIVES
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("clearance")}
            className={`btn text-sm ${viewMode === "clearance" ? "btn-primary" : "btn-secondary"}`}
          >
            BY CLEARANCE
          </button>
          <button
            onClick={() => setViewMode("department")}
            className={`btn text-sm ${viewMode === "department" ? "btn-primary" : "btn-secondary"}`}
          >
            BY DEPARTMENT
          </button>
        </div>
      </div>

      <div className="card-document p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, title, or department..."
            className="input w-full"
          />

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="input w-full"
          >
            <option value="all">All Departments</option>
            <option value="none">Unassigned</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.iconSymbol} {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-4 pt-2 border-t border-border-dark font-mono text-xs text-muted">
          <span>{filteredUsers.length} personnel found</span>
          {selectedDepartment !== "all" && (
            <button
              onClick={() => setSelectedDepartment("all")}
              className="text-gold hover:text-gold-bright"
            >
              &#10005; Clear filter
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl text-gold animate-spin-slow mb-4">&#9881;</div>
          <p className="font-mono text-muted animate-pulse">
            ACCESSING PERSONNEL DATABASE...
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card-document p-12 text-center">
          <div className="text-4xl text-gold-dim mb-4">&#9865;</div>
          <p className="font-mono text-muted">NO PERSONNEL FOUND</p>
        </div>
      ) : viewMode === "clearance" ? (
        <div className="space-y-8">
          {sortedLevels.map((level) => {
            const clearanceInfo = getClearanceInfo(level);
            return (
              <div key={level}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: clearanceInfo.color }}
                  />
                  <h2
                    className="font-mono text-sm tracking-widest"
                    style={{ color: clearanceInfo.color }}
                  >
                    LEVEL {level} - {clearanceInfo.title.toUpperCase()}
                  </h2>
                  <div className="flex-1 h-px bg-border-dark" />
                  <span className="font-mono text-xs text-muted">
                    {groupedByClearance[level].length} operative(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedByClearance[level].map((user) => (
                    <PersonnelCard key={user.id} user={user} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDepartments.map((deptName) => {
            const dept = departments.find((d) => d.name === deptName);
            const deptColor = dept?.color || "#c9a227";
            const deptIcon = dept?.iconSymbol || "&#9911;";

            return (
              <div key={deptName}>
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-xl"
                    style={{ color: deptColor }}
                    dangerouslySetInnerHTML={{ __html: deptIcon }}
                  />
                  <h2
                    className="font-mono text-sm tracking-widest"
                    style={{ color: deptColor }}
                  >
                    {deptName.toUpperCase()}
                  </h2>
                  <div className="flex-1 h-px bg-border-dark" />
                  <span className="font-mono text-xs text-muted">
                    {groupedByDepartment[deptName].length} operative(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedByDepartment[deptName].map((user) => (
                    <PersonnelCard key={user.id} user={user} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PersonnelCard({ user }: { user: User }) {
  const clearanceInfo = getClearanceInfo(user.clearanceLevel);

  return (
    <Link href={`/personnel/${user.id}`}>
      <article className="card-document p-4 hover:border-border-medium transition-all cursor-pointer group">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2"
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

          <div className="flex-1 min-w-0">
            <h3 className="font-mono text-primary group-hover:text-gold transition-colors truncate">
              {user.displayName}
            </h3>
            {user.title && (
              <p className="font-mono text-xs text-secondary truncate">
                {user.title}
              </p>
            )}
            {user.designation && (
              <p className="font-mono text-[0.65rem] text-muted truncate">
                {user.designation}
              </p>
            )}

            {user.departmentName && (
              <div className="flex items-center gap-1 mt-2">
                <span style={{ color: user.departmentColor || "#c9a227" }}>
                  {user.departmentIcon || "⛧"}
                </span>
                <span className="font-mono text-[0.6rem] text-muted">
                  {user.departmentName}
                </span>
              </div>
            )}
          </div>

          <div
            className="px-2 py-1 border font-mono text-xs"
            style={{
              borderColor: clearanceInfo.color,
              color: clearanceInfo.color,
            }}
          >
            L{user.clearanceLevel}
          </div>
        </div>
      </article>
    </Link>
  );
}
