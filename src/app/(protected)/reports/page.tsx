"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Report {
  id: string;
  reportCode: string;
  title: string;
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
  projectCode: string | null;
  projectName: string | null;
  isRead?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "badge-gray",
  normal: "badge-green",
  high: "badge-gold",
  critical: "badge-danger",
  omega: "badge-danger animate-pulse",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-gold",
  acknowledged: "text-cyan-glow",
  investigating: "text-brass",
  resolved: "text-class-green",
  archived: "text-muted",
};

const TYPE_ICONS: Record<string, string> = {
  general: "◈",
  incident: "⚠",
  intel: "◉",
  status: "☰",
  containment_breach: "⛧",
};

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", priority: "", type: "" });

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    fetchReports();
  }, [filter]);

  async function fetchReports() {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append("status", filter.status);
      if (filter.priority) params.append("priority", filter.priority);
      if (filter.type) params.append("type", filter.type);

      const res = await fetch(`/api/reports?${params}`);
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }

  const unreadCount = reports.filter((r) => r.isRead === false).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-gold tracking-wide">
            ◈ Reports & Communications
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            {clearance >= 4 && unreadCount > 0 && (
              <span className="text-gold">{unreadCount} UNREAD · </span>
            )}
            FOUNDATION COMMUNICATIONS
          </p>
        </div>

        <Link href="/reports/new" className="btn btn-primary flex items-center gap-2">
          <span>+</span>
          <span>NEW REPORT</span>
        </Link>
      </div>

      <div className="card-document p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="font-mono text-xs text-muted block mb-1">STATUS</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
              className="input bg-dark text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-xs text-muted block mb-1">PRIORITY</label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))}
              className="input bg-dark text-sm"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="omega">Omega</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-xs text-muted block mb-1">TYPE</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
              className="input bg-dark text-sm"
            >
              <option value="">All Types</option>
              <option value="general">General</option>
              <option value="incident">Incident</option>
              <option value="intel">Intel</option>
              <option value="status">Status</option>
              <option value="containment_breach">Containment Breach</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
          <p className="font-mono text-muted animate-pulse">LOADING COMMUNICATIONS...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="card-document p-12 text-center">
          <div className="text-4xl text-gold-dim mb-4">◈</div>
          <p className="font-mono text-muted">NO REPORTS FOUND</p>
          <Link href="/reports/new" className="inline-block mt-4 btn btn-secondary">
            Submit New Report
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} showReadStatus={clearance >= 4} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({
  report,
  showReadStatus,
}: {
  report: Report;
  showReadStatus: boolean;
}) {
  return (
    <Link href={`/reports/${report.id}`}>
      <article
        className={`card-document p-4 hover:border-border-medium transition-all cursor-pointer ${
          showReadStatus && report.isRead === false ? "border-l-2 border-l-gold" : ""
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="text-2xl text-gold-dim">
            {TYPE_ICONS[report.reportType] || "◈"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-gold">{report.reportCode}</span>
              <span className={`badge ${PRIORITY_COLORS[report.priority]}`}>
                {report.priority.toUpperCase()}
              </span>
              {showReadStatus && report.isRead === false && (
                <span className="badge badge-gold">UNREAD</span>
              )}
            </div>

            <h3 className="font-display text-lg text-primary truncate">{report.title}</h3>

            {report.summary && (
              <p className="font-body text-sm text-secondary mt-1 line-clamp-2">
                {report.summary}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2 font-mono text-xs text-muted">
              <span>
                BY {report.authorName.toUpperCase()}
              </span>
              <span className={STATUS_COLORS[report.status]}>
                {report.status.toUpperCase()}
              </span>
              <span>{new Date(report.createdAt).toLocaleDateString()}</span>
              {report.projectCode && <span>RE: {report.projectCode}</span>}
            </div>
          </div>

          <div className="text-gold-dim">→</div>
        </div>
      </article>
    </Link>
  );
}
