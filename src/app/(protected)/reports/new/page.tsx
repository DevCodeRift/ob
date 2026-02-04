"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  projectCode: string;
  name: string;
}

export default function NewReportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  const [form, setForm] = useState({
    title: "",
    content: "",
    summary: "",
    reportType: "general",
    priority: "normal",
    projectId: "",
    minClearanceToView: 1,
  });

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          setProjects(await res.json());
        }
      } catch (e) {
      }
    }
    fetchProjects();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          projectId: form.projectId || null,
        }),
      });

      if (res.ok) {
        const report = await res.json();
        router.push(`/reports/${report.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit report");
      }
    } catch (e) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl text-gold tracking-wide">
          ◈ Submit New Report
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          FOUNDATION COMMUNICATION
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
              ⚠ REPORT CLASSIFICATION
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Report Type</label>
                <select
                  value={form.reportType}
                  onChange={(e) => setForm({ ...form, reportType: e.target.value })}
                  className="input"
                >
                  <option value="general">◈ General Report</option>
                  <option value="incident">⚠ Incident Report</option>
                  <option value="intel">◉ Intelligence Report</option>
                  <option value="status">☰ Status Update</option>
                  <option value="containment_breach">⛧ Containment Breach</option>
                </select>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="input"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                  {clearance >= 4 && <option value="omega">Omega</option>}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Related Project (optional)</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="input"
                >
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Minimum Clearance to View</label>
                <select
                  value={form.minClearanceToView}
                  onChange={(e) =>
                    setForm({ ...form, minClearanceToView: parseInt(e.target.value) })
                  }
                  className="input"
                >
                  {[1, 2, 3, 4, 5]
                    .filter((l) => l <= clearance)
                    .map((l) => (
                      <option key={l} value={l}>
                        Level {l}+
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
              ☰ REPORT CONTENT
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="form-label">
                Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="Enter report title..."
                required
              />
            </div>

            <div>
              <label className="form-label">Summary (for listings)</label>
              <input
                type="text"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                className="input"
                placeholder="Brief summary..."
              />
            </div>

            <div>
              <label className="form-label">
                Full Report <span className="text-danger">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="input min-h-[250px]"
                placeholder="Enter full report content..."
                required
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
                <span className="ml-2">TRANSMITTING...</span>
              </>
            ) : (
              <>
                <span>◈</span>
                <span className="ml-2">SUBMIT REPORT</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
