"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getClearanceInfo } from "@/lib/constants/clearance";

interface ProposalDepartment {
  id: string;
  departmentId: string;
  departmentName: string | null;
  departmentIcon: string | null;
  departmentColor: string | null;
  isPrimary: boolean;
}

interface ClearanceRequirement {
  id: string;
  clearanceLevel: number;
  description: string | null;
}

interface Proposal {
  id: string;
  name: string;
  codename: string | null;
  objectClass: string | null;
  securityClass: string;
  threatLevel: string;
  siteAssignment: string | null;
  description: string | null;
  containmentProcedures: string | null;
  researchProtocols: string | null;
  justification: string | null;
  estimatedResources: string | null;
  proposedTimeline: string | null;
  status: string;
  adminNotes: string | null;
  rejectionReason: string | null;
  revisionNotes: string | null;
  submittedBy: string;
  submitterName: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdProjectId: string | null;
  createdAt: string;
  updatedAt: string;
  departments: ProposalDepartment[];
  clearanceRequirements: ClearanceRequirement[];
}

const STATUS_STYLES: Record<string, { label: string; class: string; color: string }> = {
  pending: { label: "PENDING REVIEW", class: "badge-warning", color: "#fbbf24" },
  under_review: { label: "UNDER REVIEW", class: "badge-gold", color: "#c9a227" },
  approved: { label: "APPROVED", class: "badge-success", color: "#4ade80" },
  rejected: { label: "REJECTED", class: "badge-danger", color: "#ef4444" },
  revision: { label: "REVISION NEEDED", class: "badge-warning", color: "#f97316" },
};

const SECURITY_COLORS: Record<string, string> = {
  GREEN: "#4ade80",
  AMBER: "#fbbf24",
  RED: "#ef4444",
  BLACK: "#6b7280",
};

export default function ProposalDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const proposalId = params.id as string;
  const clearance = session?.user?.clearanceLevel ?? 0;
  const isReviewer = clearance >= 4;
  const isOwner = proposal?.submittedBy === session?.user?.id;
  const canEdit =
    isOwner && (proposal?.status === "pending" || proposal?.status === "revision");
  const canDelete = isOwner && proposal?.status === "pending";

  useEffect(() => {
    fetchProposal();
  }, [proposalId]);

  async function fetchProposal() {
    try {
      const res = await fetch(`/api/proposals/${proposalId}`);
      if (res.ok) {
        setProposal(await res.json());
      } else {
        router.push("/proposals");
      }
    } catch (error) {
      console.error("Failed to fetch proposal:", error);
      router.push("/proposals");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this proposal?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/proposals");
      }
    } catch (error) {
      console.error("Failed to delete proposal:", error);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-gold animate-spin-slow mb-4">&#9881;</div>
        <p className="font-mono text-muted animate-pulse">LOADING PROPOSAL...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-danger mb-4">&#9888;</div>
        <p className="font-mono text-muted">PROPOSAL NOT FOUND</p>
        <Link href="/proposals" className="btn btn-secondary mt-4">
          RETURN TO PROPOSALS
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[proposal.status] || {
    label: proposal.status.toUpperCase(),
    class: "badge-secondary",
    color: "#6b7280",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/proposals"
        className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-gold transition-colors"
      >
        &larr; RETURN TO PROPOSALS
      </Link>

      <div className="card-document overflow-hidden">
        <div className="h-2" style={{ backgroundColor: statusStyle.color }} />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-2xl sm:text-3xl text-gold tracking-wide">
                  {proposal.name}
                </h1>
                <span className={`badge ${statusStyle.class}`}>{statusStyle.label}</span>
              </div>

              {proposal.codename && (
                <p className="font-mono text-gold-dim mb-2">
                  Codename: {proposal.codename}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 font-mono text-sm">
                <span
                  className="px-2 py-0.5 border"
                  style={{
                    borderColor: SECURITY_COLORS[proposal.securityClass],
                    color: SECURITY_COLORS[proposal.securityClass],
                  }}
                >
                  {proposal.securityClass}
                </span>
                <span className="text-muted">
                  THREAT:{" "}
                  <span className="text-secondary">
                    {proposal.threatLevel.toUpperCase()}
                  </span>
                </span>
                {proposal.objectClass && (
                  <span className="text-muted">
                    CLASS: <span className="text-secondary">{proposal.objectClass}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {canEdit && (
                <Link
                  href={`/proposals/${proposalId}/edit`}
                  className="btn btn-secondary text-sm"
                >
                  &#9998; EDIT
                </Link>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn btn-secondary text-sm text-danger"
                >
                  {deleting ? "..." : "&#10005; DELETE"}
                </button>
              )}
              {isReviewer && (
                <Link
                  href={`/admin/proposals`}
                  className="btn btn-primary text-sm"
                >
                  &#9881; REVIEW PANEL
                </Link>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border-dark font-mono text-xs text-muted">
            Submitted by{" "}
            <span className="text-secondary">{proposal.submitterName}</span> on{" "}
            {new Date(proposal.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {proposal.status === "approved" && proposal.createdProjectId && (
        <div className="alert-banner alert-success">
          <span className="font-mono">
            &#10003; This proposal has been approved.{" "}
            <Link
              href={`/projects/${proposal.createdProjectId}`}
              className="text-gold underline"
            >
              View Project
            </Link>
          </span>
        </div>
      )}

      {proposal.status === "rejected" && proposal.rejectionReason && (
        <div className="alert-banner alert-danger">
          <div className="font-mono">
            <strong>Rejection Reason:</strong>
            <p className="mt-1 text-secondary">{proposal.rejectionReason}</p>
          </div>
        </div>
      )}

      {proposal.status === "revision" && proposal.revisionNotes && (
        <div className="alert-banner alert-warning">
          <div className="font-mono">
            <strong>Revision Requested:</strong>
            <p className="mt-1 text-secondary">{proposal.revisionNotes}</p>
            {canEdit && (
              <Link
                href={`/proposals/${proposalId}/edit`}
                className="inline-block mt-2 text-gold underline"
              >
                Edit Proposal
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {proposal.description && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  &#9776; DESCRIPTION
                </span>
              </div>
              <div className="p-5">
                <p className="font-body text-secondary whitespace-pre-wrap leading-relaxed">
                  {proposal.description}
                </p>
              </div>
            </div>
          )}

          {proposal.containmentProcedures && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  &#128274; CONTAINMENT PROCEDURES
                </span>
              </div>
              <div className="p-5">
                <p className="font-body text-secondary whitespace-pre-wrap leading-relaxed">
                  {proposal.containmentProcedures}
                </p>
              </div>
            </div>
          )}

          {proposal.researchProtocols && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  &#9881; RESEARCH PROTOCOLS
                </span>
              </div>
              <div className="p-5">
                <p className="font-body text-secondary whitespace-pre-wrap leading-relaxed">
                  {proposal.researchProtocols}
                </p>
              </div>
            </div>
          )}

          {proposal.justification && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  &#9998; JUSTIFICATION
                </span>
              </div>
              <div className="p-5">
                <p className="font-body text-secondary whitespace-pre-wrap leading-relaxed">
                  {proposal.justification}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {proposal.departments && proposal.departments.length > 0 && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  &#9881; DEPARTMENTS
                </span>
              </div>
              <div className="divide-y divide-border-dark">
                {proposal.departments.map((dept) => (
                  <div key={dept.id} className="p-4 flex items-center gap-3">
                    <span
                      className="text-xl"
                      style={{ color: dept.departmentColor || "#c9a227" }}
                    >
                      {dept.departmentIcon || "&#9767;"}
                    </span>
                    <div>
                      <p
                        className="font-mono text-sm"
                        style={{ color: dept.departmentColor || "#c9a227" }}
                      >
                        {dept.departmentName}
                      </p>
                      {dept.isPrimary && (
                        <span className="font-mono text-xs text-gold">PRIMARY</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {proposal.clearanceRequirements &&
            proposal.clearanceRequirements.length > 0 && (
              <div className="card-document">
                <div className="bg-dark border-b border-border-dark px-5 py-3">
                  <span className="font-mono text-xs text-gold tracking-widest">
                    &#128274; CLEARANCE REQUIREMENTS
                  </span>
                </div>
                <div className="divide-y divide-border-dark">
                  {proposal.clearanceRequirements.map((req) => {
                    const clInfo = getClearanceInfo(req.clearanceLevel);
                    return (
                      <div key={req.id} className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="font-display text-lg"
                            style={{ color: clInfo.color }}
                          >
                            {req.clearanceLevel}
                          </span>
                          <span
                            className="font-mono text-xs"
                            style={{ color: clInfo.color }}
                          >
                            {clInfo.title}
                          </span>
                        </div>
                        {req.description && (
                          <p className="font-mono text-xs text-muted">
                            {req.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {(proposal.estimatedResources || proposal.proposedTimeline) && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  &#9670; PLANNING
                </span>
              </div>
              <div className="p-5 space-y-4">
                {proposal.estimatedResources && (
                  <div>
                    <p className="font-mono text-xs text-muted mb-1">
                      ESTIMATED RESOURCES
                    </p>
                    <p className="font-body text-sm text-secondary whitespace-pre-wrap">
                      {proposal.estimatedResources}
                    </p>
                  </div>
                )}
                {proposal.proposedTimeline && (
                  <div>
                    <p className="font-mono text-xs text-muted mb-1">
                      PROPOSED TIMELINE
                    </p>
                    <p className="font-body text-sm text-secondary whitespace-pre-wrap">
                      {proposal.proposedTimeline}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {proposal.siteAssignment && (
            <div className="card-document">
              <div className="bg-dark border-b border-border-dark px-5 py-3">
                <span className="font-mono text-xs text-gold tracking-widest">
                  &#9673; SITE ASSIGNMENT
                </span>
              </div>
              <div className="p-5">
                <p className="font-mono text-secondary">{proposal.siteAssignment}</p>
              </div>
            </div>
          )}

          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                &#9671; RECORD DATA
              </span>
            </div>
            <div className="p-5 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted">SUBMITTED</span>
                <span className="text-secondary">
                  {new Date(proposal.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">LAST UPDATED</span>
                <span className="text-secondary">
                  {new Date(proposal.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {proposal.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-muted">REVIEWED</span>
                  <span className="text-secondary">
                    {new Date(proposal.reviewedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
