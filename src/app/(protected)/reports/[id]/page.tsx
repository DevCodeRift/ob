"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Report {
  id: string;
  reportCode: string;
  title: string;
  content: string;
  summary: string | null;
  reportType: string;
  priority: string;
  status: string;
  minClearanceToView: number;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  authorId: string;
  authorName: string;
  authorTitle: string | null;
  authorDesignation: string | null;
  projectId: string | null;
  projectCode: string | null;
  projectName: string | null;
  acknowledgedByUser?: { name: string; title: string | null };
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "badge-gray",
  normal: "badge-green",
  high: "badge-gold",
  critical: "badge-danger",
  omega: "badge-danger animate-pulse",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "PENDING REVIEW", color: "text-gold" },
  acknowledged: { label: "ACKNOWLEDGED", color: "text-cyan-glow" },
  investigating: { label: "UNDER INVESTIGATION", color: "text-brass" },
  resolved: { label: "RESOLVED", color: "text-class-green" },
  archived: { label: "ARCHIVED", color: "text-muted" },
};

const TYPE_INFO: Record<string, { icon: string; label: string }> = {
  general: { icon: "◈", label: "GENERAL REPORT" },
  incident: { icon: "⚠", label: "INCIDENT REPORT" },
  intel: { icon: "◉", label: "INTELLIGENCE REPORT" },
  status: { icon: "☰", label: "STATUS UPDATE" },
  containment_breach: { icon: "⛧", label: "CONTAINMENT BREACH" },
};

export default function ReportDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const reportId = params.id as string;
  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  async function fetchReport() {
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.ok) {
        setReport(await res.json());
      } else if (res.status === 403) {
        router.push("/reports");
      }
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchReport();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
        <p className="font-mono text-muted animate-pulse">DECRYPTING...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-danger mb-4">⚠</div>
        <p className="font-mono text-muted">REPORT NOT FOUND OR ACCESS DENIED</p>
        <Link href="/reports" className="btn btn-secondary mt-4">
          RETURN TO REPORTS
        </Link>
      </div>
    );
  }

  const typeInfo = TYPE_INFO[report.reportType] || TYPE_INFO.general;
  const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.pending;
  const canUpdateStatus = clearance >= 3;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-gold transition-colors"
      >
        ← RETURN TO REPORTS
      </Link>

      <div className="card-document overflow-hidden">
        <div
          className={`h-1 ${
            report.priority === "critical" || report.priority === "omega"
              ? "bg-danger"
              : report.priority === "high"
              ? "bg-gold"
              : "bg-gold-dim"
          }`}
        />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl text-gold">{typeInfo.icon}</span>
                <span className="font-mono text-xs text-muted tracking-widest">
                  {typeInfo.label}
                </span>
              </div>
              <span className="font-mono text-2xl text-gold tracking-wide">
                {report.reportCode}
              </span>
            </div>
            <span className={`badge ${PRIORITY_COLORS[report.priority]}`}>
              {report.priority.toUpperCase()} PRIORITY
            </span>
          </div>

          <h1 className="font-display text-3xl text-primary tracking-wide mb-4">
            {report.title}
          </h1>

          <div className="flex items-center gap-6 py-4 border-y border-border-dark">
            <div>
              <span className="font-mono text-[0.65rem] text-muted block">STATUS</span>
              <span className={`font-mono text-lg ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>

            {canUpdateStatus && report.status !== "resolved" && report.status !== "archived" && (
              <div className="flex gap-2 ml-auto">
                {report.status === "pending" && (
                  <button
                    onClick={() => updateStatus("acknowledged")}
                    disabled={updating}
                    className="btn btn-secondary text-sm"
                  >
                    ACKNOWLEDGE
                  </button>
                )}
                {(report.status === "pending" || report.status === "acknowledged") && (
                  <button
                    onClick={() => updateStatus("investigating")}
                    disabled={updating}
                    className="btn btn-secondary text-sm"
                  >
                    INVESTIGATE
                  </button>
                )}
                <button
                  onClick={() => updateStatus("resolved")}
                  disabled={updating}
                  className="btn btn-primary text-sm"
                >
                  RESOLVE
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <span className="font-mono text-[0.65rem] text-muted">SUBMITTED BY</span>
              <p className="font-mono text-secondary">{report.authorName}</p>
              {report.authorTitle && (
                <p className="font-mono text-xs text-muted">{report.authorTitle}</p>
              )}
            </div>
            <div>
              <span className="font-mono text-[0.65rem] text-muted">SUBMITTED</span>
              <p className="font-mono text-secondary">
                {new Date(report.createdAt).toLocaleDateString()}
              </p>
              <p className="font-mono text-xs text-muted">
                {new Date(report.createdAt).toLocaleTimeString()}
              </p>
            </div>
            {report.acknowledgedAt && (
              <div>
                <span className="font-mono text-[0.65rem] text-muted">ACKNOWLEDGED</span>
                <p className="font-mono text-secondary">
                  {new Date(report.acknowledgedAt).toLocaleDateString()}
                </p>
                {report.acknowledgedByUser && (
                  <p className="font-mono text-xs text-muted">
                    By {report.acknowledgedByUser.name}
                  </p>
                )}
              </div>
            )}
            {report.resolvedAt && (
              <div>
                <span className="font-mono text-[0.65rem] text-muted">RESOLVED</span>
                <p className="font-mono text-secondary">
                  {new Date(report.resolvedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {report.projectCode && (
            <div className="mt-4 p-3 bg-dark border border-border-dark">
              <span className="font-mono text-[0.65rem] text-muted">RELATED PROJECT</span>
              <Link
                href={`/projects/${report.projectId}`}
                className="block font-mono text-gold hover:text-gold-bright"
              >
                {report.projectCode} - {report.projectName}
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="card-document">
        <div className="bg-dark border-b border-border-dark px-5 py-3">
          <span className="font-mono text-xs text-gold tracking-widest">
            ☰ REPORT CONTENT
          </span>
        </div>
        <div className="p-6">
          {report.summary && (
            <div className="mb-6 pb-6 border-b border-border-dark">
              <span className="font-mono text-xs text-muted block mb-2">SUMMARY</span>
              <p className="font-body text-lg text-secondary italic">{report.summary}</p>
            </div>
          )}

          <div className="prose-dark">
            <p className="font-body text-secondary whitespace-pre-wrap leading-relaxed text-lg">
              {report.content}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted">
          CLEARANCE LEVEL {report.minClearanceToView}+ REQUIRED TO VIEW
        </span>
        <span className="font-mono text-xs text-dim">
          DOCUMENT ID: {report.id.slice(0, 8).toUpperCase()}
        </span>
      </div>
    </div>
  );
}
