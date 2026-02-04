"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    codename: "",
    objectClass: "",
    securityClass: "GREEN",
    threatLevel: "low",
    departmentId: "",
    siteAssignment: "",
    description: "",
    containmentProcedures: "",
    researchProtocols: "",
  });

  useEffect(() => {
    if (session && (session.user?.clearanceLevel ?? 0) < 3) {
      router.push("/projects");
    }
  }, [session, router]);

  useEffect(() => {
    async function fetchDepts() {
      try {
        const res = await fetch("/api/departments");
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch (e) {
      }
    }
    fetchDepts();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          departmentId: form.departmentId || null,
        }),
      });

      if (res.ok) {
        const project = await res.json();
        router.push(`/projects/${project.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create project");
      }
    } catch (e) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  const clearance = session?.user?.clearanceLevel ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-gold tracking-wide">
          ⬡ Initialize New Project
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          CREATE RESEARCH FILE
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="alert-banner alert-danger">
            <span className="font-mono">{error}</span>
          </div>
        )}

        <div className="card-document">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              ◈ PROJECT IDENTIFICATION
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

            <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>

        <div className="card-document">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              ⚠ CLASSIFICATION
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>

        <div className="card-document">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              ☰ DOCUMENTATION
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
                className="input min-h-[120px]"
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
                className="input min-h-[100px]"
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
                className="input min-h-[100px]"
                placeholder="Approved research protocols..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
          >
            CANCEL
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? (
              <>
                <span className="animate-spin">⚙</span>
                <span className="ml-2">INITIALIZING...</span>
              </>
            ) : (
              <>
                <span>⬡</span>
                <span className="ml-2">CREATE PROJECT</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
