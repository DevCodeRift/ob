"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
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
  containmentProcedures: string | null;
  researchProtocols: string | null;
  progress: number;
  siteAssignment: string | null;
  departmentId: string | null;
}

export default function EditProjectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [project, setProject] = useState<Project | null>(null);

  const [form, setForm] = useState({
    name: "",
    codename: "",
    objectClass: "",
    securityClass: "GREEN",
    threatLevel: "low",
    status: "active",
    departmentId: "",
    siteAssignment: "",
    description: "",
    containmentProcedures: "",
    researchProtocols: "",
    progress: 0,
  });

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, deptsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch("/api/departments"),
        ]);

        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setProject(projectData);
          setForm({
            name: projectData.name || "",
            codename: projectData.codename || "",
            objectClass: projectData.objectClass || "",
            securityClass: projectData.securityClass || "GREEN",
            threatLevel: projectData.threatLevel || "low",
            status: projectData.status || "active",
            departmentId: projectData.departmentId || "",
            siteAssignment: projectData.siteAssignment || "",
            description: projectData.description || "",
            containmentProcedures: projectData.containmentProcedures || "",
            researchProtocols: projectData.researchProtocols || "",
            progress: projectData.progress || 0,
          });
        } else {
          router.push("/projects");
          return;
        }

        if (deptsRes.ok) {
          setDepartments(await deptsRes.json());
        }
      } catch (e) {
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          departmentId: form.departmentId || null,
          progress: parseInt(String(form.progress)),
        }),
      });

      if (res.ok) {
        setSuccess("Project updated successfully");
        setTimeout(() => router.push(`/projects/${projectId}`), 1000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update project");
      }
    } catch (e) {
      setError("Connection error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-gold animate-spin-slow mb-4">&#9881;</div>
        <p className="font-mono text-muted animate-pulse">LOADING PROJECT DATA...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-danger mb-4">&#9888;</div>
        <p className="font-mono text-muted">PROJECT NOT FOUND</p>
        <Link href="/projects" className="btn btn-secondary mt-4">
          RETURN TO ARCHIVES
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-gold transition-colors"
      >
        &larr; RETURN TO PROJECT
      </Link>

      <div>
        <h1 className="font-display text-2xl text-gold tracking-wide">
          &#9881; Edit Project
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          {project.projectCode} - MODIFY RESEARCH FILE
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="alert-banner alert-danger">
            <span className="font-mono">{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner alert-warning">
            <span className="font-mono">{success}</span>
          </div>
        )}

        <div className="card-document">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              &#9670; PROJECT IDENTIFICATION
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="form-label">
                Project Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Enter project designation..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Codename</label>
                <input
                  type="text"
                  value={form.codename}
                  onChange={(e) => setForm({ ...form, codename: e.target.value })}
                  className="input"
                  placeholder="e.g., CRIMSON GATE"
                />
              </div>
              <div>
                <label className="form-label">Object Class</label>
                <select
                  value={form.objectClass}
                  onChange={(e) =>
                    setForm({ ...form, objectClass: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select class...</option>
                  <option value="Safe">Safe</option>
                  <option value="Euclid">Euclid</option>
                  <option value="Keter">Keter</option>
                  <option value="Thaumiel">Thaumiel</option>
                  <option value="Apollyon">Apollyon</option>
                  <option value="Neutralized">Neutralized</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Site Assignment</label>
                <input
                  type="text"
                  value={form.siteAssignment}
                  onChange={(e) =>
                    setForm({ ...form, siteAssignment: e.target.value })
                  }
                  className="input"
                  placeholder="e.g., Site-19"
                />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="contained">Contained</option>
                  <option value="archived">Archived</option>
                  {clearance >= 5 && <option value="expunged">Expunged</option>}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card-document">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              &#9888; CLASSIFICATION
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Security Class</label>
                <select
                  value={form.securityClass}
                  onChange={(e) =>
                    setForm({ ...form, securityClass: e.target.value })
                  }
                  className="input"
                >
                  <option value="GREEN">GREEN - Standard</option>
                  {clearance >= 2 && (
                    <option value="AMBER">AMBER - Elevated</option>
                  )}
                  {clearance >= 4 && (
                    <option value="RED">RED - Restricted</option>
                  )}
                  {clearance >= 5 && (
                    <option value="BLACK">BLACK - Eyes Only</option>
                  )}
                </select>
              </div>
              <div>
                <label className="form-label">Threat Level</label>
                <select
                  value={form.threatLevel}
                  onChange={(e) =>
                    setForm({ ...form, threatLevel: e.target.value })
                  }
                  className="input"
                >
                  <option value="negligible">Negligible</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                  {clearance >= 5 && <option value="apollyon">Apollyon</option>}
                </select>
              </div>
            </div>

            {departments.length > 0 && (
              <div>
                <label className="form-label">Assigned Department</label>
                <select
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm({ ...form, departmentId: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select department...</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.iconSymbol} {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="form-label">
                Research Progress: {form.progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={form.progress}
                onChange={(e) =>
                  setForm({ ...form, progress: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-dark rounded-none appearance-none cursor-pointer accent-gold"
              />
              <div className="flex justify-between font-mono text-xs text-muted mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-document">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              &#9776; DOCUMENTATION
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="form-label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="input min-h-[120px] resize-y"
                placeholder="Project overview and objectives..."
              />
            </div>

            <div>
              <label className="form-label">Containment Procedures</label>
              <textarea
                value={form.containmentProcedures}
                onChange={(e) =>
                  setForm({ ...form, containmentProcedures: e.target.value })
                }
                className="input min-h-[100px] resize-y"
                placeholder="Special containment procedures..."
              />
            </div>

            <div>
              <label className="form-label">Research Protocols</label>
              <textarea
                value={form.researchProtocols}
                onChange={(e) =>
                  setForm({ ...form, researchProtocols: e.target.value })
                }
                className="input min-h-[100px] resize-y"
                placeholder="Approved research protocols..."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary w-full sm:w-auto"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary w-full sm:w-auto"
          >
            {saving ? (
              <>
                <span className="animate-spin inline-block">&#9881;</span>
                <span className="ml-2">SAVING...</span>
              </>
            ) : (
              <>
                <span>&#9881;</span>
                <span className="ml-2">SAVE CHANGES</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
