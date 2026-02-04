"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Department {
  id: string;
  name: string;
  iconSymbol: string;
  color: string;
}

export default function NewProposalPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  const [form, setForm] = useState({
    name: "",
    codename: "",
    objectClass: "",
    securityClass: "GREEN",
    threatLevel: "low",
    siteAssignment: "",
    description: "",
    containmentProcedures: "",
    researchProtocols: "",
    justification: "",
    estimatedResources: "",
    proposedTimeline: "",
  });

  const [selectedDepartments, setSelectedDepartments] = useState<
    { departmentId: string; isPrimary: boolean }[]
  >([]);

  const [clearanceRequirements, setClearanceRequirements] = useState<
    { clearanceLevel: number; description: string }[]
  >([]);

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch departments:", e);
    }
  }

  function toggleDepartment(deptId: string) {
    setSelectedDepartments((prev) => {
      const exists = prev.find((d) => d.departmentId === deptId);
      if (exists) {
        return prev.filter((d) => d.departmentId !== deptId);
      }
      return [...prev, { departmentId: deptId, isPrimary: prev.length === 0 }];
    });
  }

  function setPrimaryDepartment(deptId: string) {
    setSelectedDepartments((prev) =>
      prev.map((d) => ({
        ...d,
        isPrimary: d.departmentId === deptId,
      }))
    );
  }

  function addClearanceRequirement() {
    setClearanceRequirements((prev) => [
      ...prev,
      { clearanceLevel: 1, description: "" },
    ]);
  }

  function removeClearanceRequirement(index: number) {
    setClearanceRequirements((prev) => prev.filter((_, i) => i !== index));
  }

  function updateClearanceRequirement(
    index: number,
    field: "clearanceLevel" | "description",
    value: number | string
  ) {
    setClearanceRequirements((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          departmentIds: selectedDepartments,
          clearanceRequirements,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/proposals/${data.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit proposal");
      }
    } catch (e) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/proposals"
        className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-gold transition-colors"
      >
        &larr; RETURN TO PROPOSALS
      </Link>

      <div>
        <h1 className="font-display text-2xl text-gold tracking-wide">
          &#9830; New Project Proposal
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          SUBMIT FOR LEADERSHIP REVIEW
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
                  onChange={(e) => setForm({ ...form, objectClass: e.target.value })}
                  className="input"
                >
                  <option value="">Select class...</option>
                  <option value="Safe">Safe</option>
                  <option value="Euclid">Euclid</option>
                  <option value="Keter">Keter</option>
                  <option value="Thaumiel">Thaumiel</option>
                  <option value="Apollyon">Apollyon</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Site Assignment</label>
              <input
                type="text"
                value={form.siteAssignment}
                onChange={(e) => setForm({ ...form, siteAssignment: e.target.value })}
                className="input"
                placeholder="e.g., Site-19"
              />
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
                  onChange={(e) => setForm({ ...form, securityClass: e.target.value })}
                  className="input"
                >
                  <option value="GREEN">GREEN - Standard</option>
                  <option value="AMBER">AMBER - Elevated</option>
                  <option value="RED">RED - Restricted</option>
                  <option value="BLACK">BLACK - Eyes Only</option>
                </select>
              </div>
              <div>
                <label className="form-label">Threat Level</label>
                <select
                  value={form.threatLevel}
                  onChange={(e) => setForm({ ...form, threatLevel: e.target.value })}
                  className="input"
                >
                  <option value="negligible">Negligible</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                  <option value="apollyon">Apollyon</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {departments.length > 0 && (
          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                &#9881; DEPARTMENT INVOLVEMENT
              </span>
            </div>
            <div className="p-5 space-y-4">
              <p className="font-mono text-xs text-muted">
                Select all departments that should be involved in this project.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {departments.map((dept) => {
                  const isSelected = selectedDepartments.some(
                    (d) => d.departmentId === dept.id
                  );
                  const isPrimary = selectedDepartments.find(
                    (d) => d.departmentId === dept.id
                  )?.isPrimary;

                  return (
                    <div
                      key={dept.id}
                      className={`p-3 border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-gold bg-gold/10"
                          : "border-border-dark hover:border-border-medium"
                      }`}
                      onClick={() => toggleDepartment(dept.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span style={{ color: dept.color }}>{dept.iconSymbol}</span>
                          <span className="font-mono text-sm text-secondary">
                            {dept.name}
                          </span>
                        </div>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrimaryDepartment(dept.id);
                            }}
                            className={`text-xs font-mono px-2 py-0.5 border ${
                              isPrimary
                                ? "border-gold text-gold"
                                : "border-border-dark text-muted hover:text-secondary"
                            }`}
                          >
                            {isPrimary ? "PRIMARY" : "SET PRIMARY"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="card-document">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              &#128274; CLEARANCE REQUIREMENTS
            </span>
          </div>
          <div className="p-5 space-y-4">
            <p className="font-mono text-xs text-muted">
              Specify clearance levels needed to access different aspects of this project.
            </p>

            {clearanceRequirements.map((req, index) => (
              <div key={index} className="flex items-start gap-3">
                <select
                  value={req.clearanceLevel}
                  onChange={(e) =>
                    updateClearanceRequirement(index, "clearanceLevel", parseInt(e.target.value))
                  }
                  className="input w-24"
                >
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Level {lvl}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={req.description}
                  onChange={(e) =>
                    updateClearanceRequirement(index, "description", e.target.value)
                  }
                  className="input flex-1"
                  placeholder="Why this clearance is needed..."
                />
                <button
                  type="button"
                  onClick={() => removeClearanceRequirement(index)}
                  className="btn btn-secondary text-danger px-3"
                >
                  &#10005;
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addClearanceRequirement}
              className="btn btn-secondary text-sm"
            >
              + Add Clearance Requirement
            </button>
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
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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

        <div className="card-document">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              &#9998; JUSTIFICATION
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="form-label">
                Why should this project be approved?{" "}
                <span className="text-danger">*</span>
              </label>
              <textarea
                value={form.justification}
                onChange={(e) => setForm({ ...form, justification: e.target.value })}
                className="input min-h-[100px] resize-y"
                placeholder="Explain the importance and value of this project..."
                required
              />
            </div>

            <div>
              <label className="form-label">Estimated Resources</label>
              <textarea
                value={form.estimatedResources}
                onChange={(e) =>
                  setForm({ ...form, estimatedResources: e.target.value })
                }
                className="input min-h-[80px] resize-y"
                placeholder="Personnel, equipment, budget requirements..."
              />
            </div>

            <div>
              <label className="form-label">Proposed Timeline</label>
              <textarea
                value={form.proposedTimeline}
                onChange={(e) =>
                  setForm({ ...form, proposedTimeline: e.target.value })
                }
                className="input min-h-[80px] resize-y"
                placeholder="Expected milestones and completion timeline..."
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
            disabled={loading}
            className="btn btn-primary w-full sm:w-auto"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">&#9881;</span>
                <span className="ml-2">SUBMITTING...</span>
              </>
            ) : (
              <>
                <span>&#9830;</span>
                <span className="ml-2">SUBMIT PROPOSAL</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
