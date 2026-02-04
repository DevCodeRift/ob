"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Project {
  id: string;
  projectCode: string;
  name: string;
  codename: string | null;
  securityClass: string;
  status: string;
  departmentName: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "text-class-green",
  review: "text-gold",
  suspended: "text-danger",
  archived: "text-muted",
  expunged: "text-danger",
};

const SECURITY_COLORS: Record<string, string> = {
  GREEN: "border-class-green text-class-green",
  AMBER: "border-brass text-brass",
  RED: "border-danger text-danger",
  BLACK: "border-primary text-primary bg-void",
};

export default function AdminProjectsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    if (clearance < 5) {
      router.push("/dashboard");
      return;
    }
    fetchProjects();
  }, [clearance, router]);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.projectCode.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.codename?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            ⬡ All Projects
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            COMPLETE PROJECT REGISTRY
          </p>
        </div>
        <Link href="/projects/new" className="btn btn-primary">
          + NEW PROJECT
        </Link>
      </div>

      <div className="card-document p-4 flex flex-wrap gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="input flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="review">Review</option>
          <option value="suspended">Suspended</option>
          <option value="archived">Archived</option>
          <option value="expunged">Expunged</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="TOTAL"
          value={projects.length}
          icon="⬡"
        />
        <StatCard
          label="ACTIVE"
          value={projects.filter((p) => p.status === "active").length}
          icon="◉"
          color="green"
        />
        <StatCard
          label="REVIEW"
          value={projects.filter((p) => p.status === "review").length}
          icon="◎"
          color="gold"
        />
        <StatCard
          label="SUSPENDED"
          value={projects.filter((p) => p.status === "suspended").length}
          icon="⊘"
          color="danger"
        />
        <StatCard
          label="ARCHIVED"
          value={projects.filter((p) => p.status === "archived").length}
          icon="◇"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
          <p className="font-mono text-muted animate-pulse">
            ACCESSING PROJECT DATABASE...
          </p>
        </div>
      ) : (
        <div className="card-document overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-dark border-b border-border-dark">
                <th className="px-4 py-3 text-left font-mono text-xs text-gold-dim">
                  PROJECT
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs text-gold-dim">
                  SECURITY
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs text-gold-dim">
                  DEPARTMENT
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs text-gold-dim">
                  STATUS
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs text-gold-dim">
                  CREATED
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs text-gold-dim">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-elevated transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-mono text-gold">
                        {project.projectCode}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-secondary">
                      {project.name}
                    </div>
                    {project.codename && (
                      <div className="font-mono text-xs text-muted italic">
                        "{project.codename}"
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 border font-mono text-xs ${
                        SECURITY_COLORS[project.securityClass] || ""
                      }`}
                    >
                      {project.securityClass}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-secondary">
                      {project.departmentName || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono text-xs uppercase ${
                        STATUS_COLORS[project.status] || ""
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="btn btn-secondary text-xs"
                    >
                      VIEW
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProjects.length === 0 && (
            <div className="p-8 text-center">
              <p className="font-mono text-muted">NO PROJECTS FOUND</p>
            </div>
          )}
        </div>
      )}

      <div className="text-center binary-decoration py-4">
        PROJECT REGISTRY · OMNISSIAH PROTECTS
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = "default",
}: {
  label: string;
  value: number;
  icon: string;
  color?: "default" | "green" | "gold" | "danger";
}) {
  const colorClasses = {
    default: "text-gold",
    green: "text-class-green",
    gold: "text-gold",
    danger: "text-danger",
  };

  return (
    <div className="card-document p-4 text-center">
      <span className="text-2xl text-gold-dim">{icon}</span>
      <p className={`font-mono text-2xl mt-2 ${colorClasses[color]}`}>
        {value}
      </p>
      <p className="font-mono text-[0.6rem] text-muted mt-1">{label}</p>
    </div>
  );
}
