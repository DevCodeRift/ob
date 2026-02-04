"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Project {
  id: string;
  projectCode: string;
  name: string;
  codename: string | null;
  objectClass: string | null;
  securityClass: string;
  threatLevel: string;
  status: string;
  description: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  departmentName: string | null;
  departmentIcon: string | null;
}

const THREAT_COLORS: Record<string, string> = {
  negligible: "text-muted",
  low: "text-cyan-glow",
  moderate: "text-gold",
  high: "text-brass",
  critical: "text-danger",
  apollyon: "text-danger animate-pulse",
};

const SECURITY_COLORS: Record<string, string> = {
  GREEN: "border-class-green text-class-green",
  AMBER: "border-gold text-gold",
  RED: "border-danger text-danger",
  BLACK: "border-white text-white bg-black",
};

const STATUS_BADGES: Record<string, { color: string; label: string }> = {
  active: { color: "badge-green", label: "ACTIVE" },
  review: { color: "badge-gold", label: "UNDER REVIEW" },
  suspended: { color: "badge-brass", label: "SUSPENDED" },
  archived: { color: "badge-gray", label: "ARCHIVED" },
  expunged: { color: "badge-danger", label: "EXPUNGED" },
};

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", security: "" });

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  async function fetchProjects() {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append("status", filter.status);
      if (filter.security) params.append("security", filter.security);

      const res = await fetch(`/api/projects?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  }

  const canCreate = (session?.user?.clearanceLevel ?? 0) >= 3;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-gold tracking-wide">
            ⬡ Research Projects
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            FOUNDATION RESEARCH ARCHIVES
          </p>
        </div>

        {canCreate && (
          <Link
            href="/projects/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <span>+</span>
            <span>NEW PROJECT</span>
          </Link>
        )}
      </div>

      <div className="card-document p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="font-mono text-xs text-muted block mb-1">
              STATUS
            </label>
            <select
              value={filter.status}
              onChange={(e) =>
                setFilter((f) => ({ ...f, status: e.target.value }))
              }
              className="input bg-dark text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="review">Under Review</option>
              <option value="suspended">Suspended</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-xs text-muted block mb-1">
              SECURITY CLASS
            </label>
            <select
              value={filter.security}
              onChange={(e) =>
                setFilter((f) => ({ ...f, security: e.target.value }))
              }
              className="input bg-dark text-sm"
            >
              <option value="">All Classes</option>
              <option value="GREEN">GREEN</option>
              <option value="AMBER">AMBER</option>
              {(session?.user?.clearanceLevel ?? 0) >= 4 && (
                <option value="RED">RED</option>
              )}
              {(session?.user?.clearanceLevel ?? 0) >= 5 && (
                <option value="BLACK">BLACK</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
          <p className="font-mono text-muted animate-pulse">
            ACCESSING ARCHIVES...
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="card-document p-12 text-center">
          <div className="text-4xl text-gold-dim mb-4">⬡</div>
          <p className="font-mono text-muted">NO PROJECTS FOUND</p>
          {canCreate && (
            <Link
              href="/projects/new"
              className="inline-block mt-4 btn btn-secondary"
            >
              Initialize New Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <div className="text-center binary-decoration py-4">
        {projects.length} RESEARCH FILES ACCESSIBLE
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const statusBadge = STATUS_BADGES[project.status] || STATUS_BADGES.active;

  return (
    <article className="card-document group hover:border-border-medium transition-all overflow-hidden">
      <div
        className={`h-1 w-full ${
          project.threatLevel === "critical" || project.threatLevel === "apollyon"
            ? "bg-danger"
            : project.threatLevel === "high"
            ? "bg-gold"
            : project.threatLevel === "moderate"
            ? "bg-brass"
            : "bg-cyan-glow"
        }`}
      />

      <div className="p-4 border-b border-border-dark">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="font-mono text-[0.55rem] text-muted tracking-widest">
              RESEARCH FILE
            </span>
            <p className="font-mono text-lg text-gold tracking-wide">
              {project.projectCode}
            </p>
          </div>
          <span
            className={`px-2 py-0.5 border font-mono text-xs ${
              SECURITY_COLORS[project.securityClass]
            }`}
          >
            {project.securityClass}
          </span>
        </div>

        <h3 className="font-display text-lg text-primary tracking-wide">
          {project.name}
        </h3>
        {project.codename && (
          <p className="font-body text-sm italic text-secondary">
            Codename: &ldquo;{project.codename}&rdquo;
          </p>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-muted">STATUS</span>
          <span className={`badge ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-muted">THREAT LEVEL</span>
          <span
            className={`font-mono uppercase ${THREAT_COLORS[project.threatLevel]}`}
          >
            {project.threatLevel}
          </span>
        </div>

        {project.objectClass && (
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-muted">OBJECT CLASS</span>
            <span className="font-mono text-secondary">{project.objectClass}</span>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-muted">RESEARCH PROGRESS</span>
            <span className="font-mono text-gold">{project.progress}%</span>
          </div>
          <div className="progress-bar h-2">
            <div
              className="progress-bar-fill h-full"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {project.departmentName && (
          <div className="flex items-center gap-2 text-xs pt-2 border-t border-border-dark">
            <span className="text-gold-dim">{project.departmentIcon || "⛧"}</span>
            <span className="font-mono text-muted">{project.departmentName}</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-dark border-t border-border-dark">
        <Link
          href={`/projects/${project.id}`}
          className="block w-full btn btn-secondary text-center text-sm"
        >
          ACCESS DOSSIER
        </Link>
      </div>
    </article>
  );
}
