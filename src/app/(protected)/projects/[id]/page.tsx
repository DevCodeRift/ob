"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AccessRule {
  id: string;
  accessType: string;
  targetId: string | null;
  minClearance: number | null;
  role: string;
  createdAt: string;
  targetName: string | null;
  departmentName: string | null;
}

interface ApprovalInfo {
  proposalId: string;
  approvedBy: string | null;
  approvedAt: string | null;
  approverName: string | null;
  approverTitle: string | null;
}

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
  containmentProcedures: string | null;
  researchProtocols: string | null;
  progress: number;
  siteAssignment: string | null;
  createdAt: string;
  updatedAt: string;
  departmentId: string | null;
  departmentName: string | null;
  departmentIcon: string | null;
  team: TeamMember[];
  logbookEntryCount: number;
  accessRules: AccessRule[];
  approvalInfo: ApprovalInfo | null;
  leadResearcher: TeamMember | null;
}

interface TeamMember {
  id: string;
  role: string;
  assignedAt: string;
  userId: string;
  userName: string;
  userTitle: string | null;
  userDesignation: string | null;
  userClearance: number;
}

interface LogbookEntry {
  id: string;
  entryNumber: number;
  entryText: string;
  entryType: string;
  createdAt: string;
  authorName: string;
  authorTitle: string | null;
  authorDesignation: string | null;
}

const SECURITY_COLORS: Record<string, string> = {
  GREEN: "border-class-green text-class-green",
  AMBER: "border-gold text-gold",
  RED: "border-danger text-danger",
  BLACK: "border-white text-white bg-void",
};

const THREAT_COLORS: Record<string, string> = {
  negligible: "text-muted",
  low: "text-cyan-glow",
  moderate: "text-gold",
  high: "text-brass",
  critical: "text-danger",
  apollyon: "text-danger animate-pulse",
};

const ENTRY_TYPE_ICONS: Record<string, string> = {
  observation: "◉",
  experiment: "⚗",
  incident: "⚠",
  note: "◈",
  addendum: "+",
  interview: "☺",
};

export default function ProjectDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [logbook, setLogbook] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogbookForm, setShowLogbookForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ entryText: "", entryType: "observation" });
  const [submitting, setSubmitting] = useState(false);
  const [showExpungeConfirm, setShowExpungeConfirm] = useState(false);
  const [expunging, setExpunging] = useState(false);

  const projectId = params.id as string;

  useEffect(() => {
    fetchProject();
    fetchLogbook();
  }, [projectId]);

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        setProject(await res.json());
      } else if (res.status === 403) {
        router.push("/projects");
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogbook() {
    try {
      const res = await fetch(`/api/projects/${projectId}/logbook`);
      if (res.ok) {
        setLogbook(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch logbook:", error);
    }
  }

  async function submitEntry(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/logbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });

      if (res.ok) {
        setNewEntry({ entryText: "", entryType: "observation" });
        setShowLogbookForm(false);
        fetchLogbook();
        fetchProject();
      }
    } catch (error) {
      console.error("Failed to submit entry:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function expungeProject() {
    setExpunging(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/projects");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to expunge project");
      }
    } catch (error) {
      console.error("Failed to expunge project:", error);
      alert("Failed to expunge project");
    } finally {
      setExpunging(false);
      setShowExpungeConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
        <p className="font-mono text-muted animate-pulse">ACCESSING FILE...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-danger mb-4">⚠</div>
        <p className="font-mono text-muted">PROJECT NOT FOUND OR ACCESS DENIED</p>
        <Link href="/projects" className="btn btn-secondary mt-4">
          RETURN TO ARCHIVES
        </Link>
      </div>
    );
  }

  const isTeamMember = project.team.some((m) => m.userId === session?.user?.id);
  const isLead = project.team.some(
    (m) => m.userId === session?.user?.id && m.role === "lead"
  );
  const canEdit = isLead || (session?.user?.clearanceLevel ?? 0) >= 5;
  const canAddEntry = isTeamMember || (session?.user?.clearanceLevel ?? 0) >= 4;
  const canExpunge = (session?.user?.clearanceLevel ?? 0) >= 5;

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-gold transition-colors"
      >
        ← RETURN TO ARCHIVES
      </Link>

      <div className="card-document overflow-hidden">
        <div
          className={`h-1 ${
            project.threatLevel === "critical" || project.threatLevel === "apollyon"
              ? "bg-danger"
              : project.threatLevel === "high"
              ? "bg-gold"
              : "bg-gold-dim"
          }`}
        />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="font-mono text-xs text-muted tracking-widest">
                RESEARCH FILE
              </span>
              <h1 className="font-mono text-2xl text-gold tracking-wide">
                {project.projectCode}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 border font-mono text-sm ${
                  SECURITY_COLORS[project.securityClass]
                }`}
              >
                {project.securityClass}
              </span>
              {canEdit && (
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="btn btn-secondary text-sm"
                >
                  EDIT
                </Link>
              )}
              {canExpunge && project.status !== "expunged" && (
                <button
                  onClick={() => setShowExpungeConfirm(true)}
                  className="btn text-sm bg-danger/20 border-danger text-danger hover:bg-danger/30"
                >
                  EXPUNGE
                </button>
              )}
            </div>
          </div>

          <h2 className="font-display text-3xl text-primary tracking-wide mb-2">
            {project.name}
          </h2>
          {project.codename && (
            <p className="font-body text-lg italic text-secondary mb-4">
              Codename: &ldquo;{project.codename}&rdquo;
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <span className="font-mono text-[0.65rem] text-muted">STATUS</span>
              <p className="font-mono text-gold uppercase">{project.status}</p>
            </div>
            <div>
              <span className="font-mono text-[0.65rem] text-muted">THREAT LEVEL</span>
              <p className={`font-mono uppercase ${THREAT_COLORS[project.threatLevel]}`}>
                {project.threatLevel}
              </p>
            </div>
            {project.objectClass && (
              <div>
                <span className="font-mono text-[0.65rem] text-muted">OBJECT CLASS</span>
                <p className="font-mono text-secondary">{project.objectClass}</p>
              </div>
            )}
            {project.siteAssignment && (
              <div>
                <span className="font-mono text-[0.65rem] text-muted">SITE</span>
                <p className="font-mono text-secondary">{project.siteAssignment}</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-muted">RESEARCH PROGRESS</span>
              <span className="font-mono text-gold">{project.progress}%</span>
            </div>
            <div className="progress-bar h-3">
              <div
                className="progress-bar-fill h-full"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {project.description && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  ☰ DESCRIPTION
                </span>
              </div>
              <div className="p-5">
                <p className="font-body text-secondary whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>
              </div>
            </div>
          )}

          {project.containmentProcedures && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-danger tracking-widest">
                  ⚠ CONTAINMENT PROCEDURES
                </span>
              </div>
              <div className="p-5">
                <p className="font-body text-secondary whitespace-pre-wrap leading-relaxed">
                  {project.containmentProcedures}
                </p>
              </div>
            </div>
          )}

          {project.researchProtocols && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  ⚗ RESEARCH PROTOCOLS
                </span>
              </div>
              <div className="p-5">
                <p className="font-body text-secondary whitespace-pre-wrap leading-relaxed">
                  {project.researchProtocols}
                </p>
              </div>
            </div>
          )}

          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3 flex items-center justify-between">
              <span className="font-mono text-xs text-gold tracking-widest">
                ◈ RESEARCH LOGBOOK ({logbook.length} entries)
              </span>
              {canAddEntry && (
                <button
                  onClick={() => setShowLogbookForm(!showLogbookForm)}
                  className="font-mono text-xs text-gold hover:text-gold-bright"
                >
                  + NEW ENTRY
                </button>
              )}
            </div>

            {showLogbookForm && (
              <form onSubmit={submitEntry} className="p-5 border-b border-border-dark bg-elevated">
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Entry Type</label>
                    <select
                      value={newEntry.entryType}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, entryType: e.target.value })
                      }
                      className="input"
                    >
                      <option value="observation">◉ Observation</option>
                      <option value="experiment">⚗ Experiment</option>
                      <option value="incident">⚠ Incident</option>
                      <option value="note">◈ Note</option>
                      <option value="addendum">+ Addendum</option>
                      <option value="interview">☺ Interview</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Entry Content</label>
                    <textarea
                      value={newEntry.entryText}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, entryText: e.target.value })
                      }
                      className="input min-h-[150px]"
                      placeholder="Record your observations..."
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={submitting} className="btn btn-primary">
                      {submitting ? "SUBMITTING..." : "SUBMIT ENTRY"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLogbookForm(false)}
                      className="btn btn-secondary"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="divide-y divide-border-dark">
              {logbook.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-mono text-muted">NO ENTRIES RECORDED</p>
                </div>
              ) : (
                logbook.map((entry) => (
                  <div key={entry.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl text-gold-dim">
                        {ENTRY_TYPE_ICONS[entry.entryType] || "◈"}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs text-gold">
                            ENTRY #{entry.entryNumber}
                          </span>
                          <span className="font-mono text-[0.65rem] text-muted uppercase">
                            {entry.entryType}
                          </span>
                          <span className="font-mono text-[0.65rem] text-dim">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-body text-secondary whitespace-pre-wrap leading-relaxed">
                          {entry.entryText}
                        </p>
                        <p className="font-mono text-xs text-muted mt-2">
                          — {entry.authorName}
                          {entry.authorTitle && `, ${entry.authorTitle}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ⚉ ASSIGNED PERSONNEL
              </span>
            </div>
            <div className="divide-y divide-border-dark">
              {project.team.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="font-mono text-muted text-sm">NO PERSONNEL ASSIGNED</p>
                </div>
              ) : (
                project.team.map((member) => (
                  <div key={member.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-primary">{member.userName}</p>
                        {member.userTitle && (
                          <p className="font-mono text-xs text-muted">{member.userTitle}</p>
                        )}
                      </div>
                      <span
                        className={`font-mono text-[0.65rem] uppercase ${
                          member.role === "lead"
                            ? "text-gold"
                            : member.role === "researcher"
                            ? "text-secondary"
                            : "text-muted"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {project.leadResearcher && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  ★ LEAD RESEARCHER
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold flex items-center justify-center">
                    <span className="text-gold font-mono text-lg">
                      {project.leadResearcher.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-gold">{project.leadResearcher.userName}</p>
                    {project.leadResearcher.userTitle && (
                      <p className="font-mono text-xs text-muted">
                        {project.leadResearcher.userTitle}
                      </p>
                    )}
                    {project.leadResearcher.userDesignation && (
                      <p className="font-mono text-[0.65rem] text-dim">
                        {project.leadResearcher.userDesignation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {project.approvalInfo && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-class-green tracking-widest">
                  ✓ APPROVAL RECORD
                </span>
              </div>
              <div className="p-5 space-y-3">
                {project.approvalInfo.approverName && (
                  <div>
                    <span className="font-mono text-[0.65rem] text-muted block mb-1">
                      APPROVED BY
                    </span>
                    <p className="font-mono text-primary">
                      {project.approvalInfo.approverName}
                    </p>
                    {project.approvalInfo.approverTitle && (
                      <p className="font-mono text-xs text-muted">
                        {project.approvalInfo.approverTitle}
                      </p>
                    )}
                  </div>
                )}
                {project.approvalInfo.approvedAt && (
                  <div>
                    <span className="font-mono text-[0.65rem] text-muted block mb-1">
                      APPROVED ON
                    </span>
                    <p className="font-mono text-xs text-secondary">
                      {new Date(project.approvalInfo.approvedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {project.accessRules && project.accessRules.length > 0 && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  🔒 ACCESS PERMISSIONS
                </span>
              </div>
              <div className="divide-y divide-border-dark">
                {project.accessRules.map((rule) => (
                  <div key={rule.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        {rule.accessType === "user" && rule.targetName && (
                          <p className="font-mono text-sm text-primary">
                            {rule.targetName}
                          </p>
                        )}
                        {rule.accessType === "department" && rule.departmentName && (
                          <p className="font-mono text-sm text-primary">
                            {rule.departmentName}
                          </p>
                        )}
                        {rule.accessType === "clearance" && rule.minClearance && (
                          <p className="font-mono text-sm text-primary">
                            Clearance Level {rule.minClearance}+
                          </p>
                        )}
                        {rule.accessType === "rank" && (
                          <p className="font-mono text-sm text-primary">
                            Rank-based Access
                          </p>
                        )}
                        <p className="font-mono text-[0.65rem] text-muted uppercase">
                          {rule.accessType}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-[0.65rem] uppercase ${
                          rule.role === "lead"
                            ? "text-gold"
                            : rule.role === "researcher"
                            ? "text-secondary"
                            : "text-muted"
                        }`}
                      >
                        {rule.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ◇ FILE METADATA
              </span>
            </div>
            <div className="p-5 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted">CREATED</span>
                <span className="text-secondary">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">UPDATED</span>
                <span className="text-secondary">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">ENTRIES</span>
                <span className="text-secondary">{project.logbookEntryCount}</span>
              </div>
              {project.departmentName && (
                <div className="flex justify-between">
                  <span className="text-muted">DEPARTMENT</span>
                  <span className="text-secondary">
                    {project.departmentIcon} {project.departmentName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showExpungeConfirm && (
        <div className="fixed inset-0 bg-void/80 flex items-center justify-center z-50">
          <div className="card-document max-w-md w-full mx-4">
            <div className="bg-danger/20 border-b border-danger px-5 py-3">
              <span className="font-mono text-xs text-danger tracking-widest">
                ⚠ CONFIRM EXPUNGEMENT
              </span>
            </div>
            <div className="p-6 space-y-4">
              <p className="font-body text-secondary">
                You are about to expunge project <span className="text-gold font-mono">{project.projectCode}</span>.
              </p>
              <p className="font-body text-muted text-sm">
                This action will mark the project as expunged and remove it from active archives.
                This action can only be performed by Archmagos-level personnel.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={expungeProject}
                  disabled={expunging}
                  className="btn bg-danger text-white hover:bg-danger/80 flex-1"
                >
                  {expunging ? "EXPUNGING..." : "CONFIRM EXPUNGE"}
                </button>
                <button
                  onClick={() => setShowExpungeConfirm(false)}
                  disabled={expunging}
                  className="btn btn-secondary flex-1"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
