"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Proposal {
  id: string;
  name: string;
  codename: string | null;
  securityClass: string;
  threatLevel: string;
  status: string;
  submittedBy: string;
  submitterName: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
  pending: { label: "PENDING", class: "badge-warning" },
  under_review: { label: "UNDER REVIEW", class: "badge-gold" },
  approved: { label: "APPROVED", class: "badge-success" },
  rejected: { label: "REJECTED", class: "badge-danger" },
  revision: { label: "REVISION", class: "badge-warning" },
};

const SECURITY_COLORS: Record<string, string> = {
  GREEN: "#4ade80",
  AMBER: "#fbbf24",
  RED: "#ef4444",
  BLACK: "#6b7280",
};

export default function AdminProposalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<
    "approve" | "reject" | "revision" | "review" | null
  >(null);
  const [modalNotes, setModalNotes] = useState("");

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || clearance < 4) {
      router.push("/dashboard");
      return;
    }
    fetchProposals();
  }, [status, clearance, router]);

  async function fetchProposals() {
    try {
      const res = await fetch("/api/proposals");
      if (res.ok) {
        setProposals(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch proposals:", error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(
    proposalId: string,
    action: "approve" | "reject" | "revision" | "review"
  ) {
    setSelectedProposal(proposalId);
    setModalAction(action);
    setModalNotes("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedProposal(null);
    setModalAction(null);
    setModalNotes("");
  }

  async function handleAction() {
    if (!selectedProposal || !modalAction) return;

    setActionLoading(true);
    try {
      if (modalAction === "approve") {
        const res = await fetch(`/api/proposals/${selectedProposal}/approve`, {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          alert(`Project ${data.project.projectCode} created successfully!`);
        } else {
          const data = await res.json();
          alert(data.error || "Failed to approve");
        }
      } else {
        const statusMap = {
          reject: "rejected",
          revision: "revision",
          review: "under_review",
        };

        const body: Record<string, any> = {
          status: statusMap[modalAction],
        };

        if (modalAction === "reject") {
          body.rejectionReason = modalNotes;
        } else if (modalAction === "revision") {
          body.revisionNotes = modalNotes;
        } else if (modalAction === "review") {
          body.adminNotes = modalNotes;
        }

        const res = await fetch(`/api/proposals/${selectedProposal}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Failed to update");
        }
      }

      fetchProposals();
      closeModal();
    } catch (error) {
      console.error("Action failed:", error);
      alert("Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  const filteredProposals = proposals.filter((p) => {
    if (filter === "all") return true;
    if (filter === "active")
      return ["pending", "under_review", "revision"].includes(p.status);
    return p.status === filter;
  });

  if (status === "loading" || loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl text-gold animate-spin-slow mb-4">&#9881;</div>
        <p className="font-mono text-muted animate-pulse">
          LOADING PROPOSALS...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-gold tracking-wide">
            &#9830; Proposal Review
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            LEADERSHIP APPROVAL PANEL
          </p>
        </div>

        <Link href="/proposals" className="btn btn-secondary">
          &larr; My Proposals
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {["active", "pending", "under_review", "revision", "approved", "rejected", "all"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 font-mono text-xs border transition-colors ${
                filter === status
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border-dark text-muted hover:border-border-medium"
              }`}
            >
              {status === "active"
                ? "ACTIVE"
                : status === "all"
                ? "ALL"
                : STATUS_STYLES[status]?.label || status.toUpperCase()}
            </button>
          )
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {["pending", "under_review", "revision", "approved", "rejected"].map(
          (status) => {
            const count = proposals.filter((p) => p.status === status).length;
            const style = STATUS_STYLES[status];
            return (
              <div
                key={status}
                className="card-document p-3 text-center cursor-pointer hover:border-border-medium transition-colors"
                onClick={() => setFilter(status)}
              >
                <p className="font-display text-2xl text-gold">{count}</p>
                <p className="font-mono text-[0.65rem] text-muted tracking-wider">
                  {style?.label || status.toUpperCase()}
                </p>
              </div>
            );
          }
        )}
      </div>

      {filteredProposals.length === 0 ? (
        <div className="card-document p-12 text-center">
          <div className="text-4xl text-gold-dim mb-4">&#9830;</div>
          <p className="font-mono text-muted">NO PROPOSALS IN THIS CATEGORY</p>
        </div>
      ) : (
        <div className="card-document overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark border-b border-border-dark">
                  <th className="px-4 py-3 text-left font-mono text-xs text-gold tracking-wider">
                    PROJECT
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs text-gold tracking-wider">
                    SUBMITTER
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs text-gold tracking-wider">
                    SECURITY
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs text-gold tracking-wider">
                    STATUS
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs text-gold tracking-wider">
                    DATE
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-xs text-gold tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {filteredProposals.map((proposal) => {
                  const statusStyle = STATUS_STYLES[proposal.status] || {
                    label: proposal.status.toUpperCase(),
                    class: "badge-secondary",
                  };
                  return (
                    <tr
                      key={proposal.id}
                      className="hover:bg-elevated transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/proposals/${proposal.id}`}
                          className="hover:text-gold transition-colors"
                        >
                          <p className="font-display text-primary">
                            {proposal.name}
                          </p>
                          {proposal.codename && (
                            <p className="font-mono text-xs text-muted">
                              {proposal.codename}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-secondary">
                        {proposal.submitterName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs px-2 py-0.5 border"
                          style={{
                            borderColor: SECURITY_COLORS[proposal.securityClass],
                            color: SECURITY_COLORS[proposal.securityClass],
                          }}
                        >
                          {proposal.securityClass}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${statusStyle.class}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {proposal.status === "pending" && (
                            <button
                              onClick={() => openModal(proposal.id, "review")}
                              className="btn btn-secondary text-xs px-2 py-1"
                            >
                              REVIEW
                            </button>
                          )}
                          {["pending", "under_review"].includes(
                            proposal.status
                          ) && (
                            <>
                              <button
                                onClick={() => openModal(proposal.id, "approve")}
                                className="btn btn-secondary text-xs px-2 py-1 text-class-green"
                              >
                                APPROVE
                              </button>
                              <button
                                onClick={() =>
                                  openModal(proposal.id, "revision")
                                }
                                className="btn btn-secondary text-xs px-2 py-1 text-gold"
                              >
                                REVISE
                              </button>
                              <button
                                onClick={() => openModal(proposal.id, "reject")}
                                className="btn btn-secondary text-xs px-2 py-1 text-danger"
                              >
                                REJECT
                              </button>
                            </>
                          )}
                          <Link
                            href={`/proposals/${proposal.id}`}
                            className="btn btn-secondary text-xs px-2 py-1"
                          >
                            VIEW
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card-document max-w-lg w-full">
            <div className="bg-dark border-b border-border-dark px-5 py-3 flex items-center justify-between">
              <span className="font-mono text-xs text-gold tracking-widest">
                {modalAction === "approve" && "&#10003; APPROVE PROPOSAL"}
                {modalAction === "reject" && "&#10005; REJECT PROPOSAL"}
                {modalAction === "revision" && "&#9998; REQUEST REVISION"}
                {modalAction === "review" && "&#9881; MARK UNDER REVIEW"}
              </span>
              <button
                onClick={closeModal}
                className="text-muted hover:text-primary"
              >
                &#10005;
              </button>
            </div>
            <div className="p-5 space-y-4">
              {modalAction === "approve" && (
                <p className="font-mono text-sm text-secondary">
                  This will approve the proposal and create a new project. The
                  submitter will be assigned as the project lead.
                </p>
              )}

              {modalAction === "reject" && (
                <div>
                  <label className="form-label">
                    Rejection Reason <span className="text-danger">*</span>
                  </label>
                  <textarea
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="input min-h-[100px] resize-y"
                    placeholder="Explain why this proposal is being rejected..."
                    required
                  />
                </div>
              )}

              {modalAction === "revision" && (
                <div>
                  <label className="form-label">
                    Revision Notes <span className="text-danger">*</span>
                  </label>
                  <textarea
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="input min-h-[100px] resize-y"
                    placeholder="What changes need to be made before approval..."
                    required
                  />
                </div>
              )}

              {modalAction === "review" && (
                <div>
                  <label className="form-label">Internal Notes (Optional)</label>
                  <textarea
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="input min-h-[100px] resize-y"
                    placeholder="Notes for other reviewers..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={closeModal}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleAction}
                  disabled={
                    actionLoading ||
                    ((modalAction === "reject" || modalAction === "revision") &&
                      !modalNotes.trim())
                  }
                  className={`btn ${
                    modalAction === "approve"
                      ? "btn-primary"
                      : modalAction === "reject"
                      ? "bg-danger text-white"
                      : "btn-primary"
                  }`}
                >
                  {actionLoading ? (
                    <span className="animate-spin">&#9881;</span>
                  ) : modalAction === "approve" ? (
                    "APPROVE & CREATE PROJECT"
                  ) : modalAction === "reject" ? (
                    "REJECT PROPOSAL"
                  ) : modalAction === "revision" ? (
                    "REQUEST REVISION"
                  ) : (
                    "MARK UNDER REVIEW"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
