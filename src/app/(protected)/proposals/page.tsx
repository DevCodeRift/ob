"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  revision: { label: "REVISION NEEDED", class: "badge-warning" },
};

const SECURITY_COLORS: Record<string, string> = {
  GREEN: "#4ade80",
  AMBER: "#fbbf24",
  RED: "#ef4444",
  BLACK: "#6b7280",
};

export default function ProposalsPage() {
  const { data: session } = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const clearance = session?.user?.clearanceLevel ?? 0;
  const isReviewer = clearance >= 4;

  useEffect(() => {
    fetchProposals();
  }, []);

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

  const filteredProposals = proposals.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-gold tracking-wide">
            &#9830; Project Proposals
          </h1>
          <p className="font-mono text-xs text-muted mt-1">
            {isReviewer ? "ALL SUBMITTED PROPOSALS" : "YOUR SUBMITTED PROPOSALS"}
          </p>
        </div>

        <Link href="/proposals/new" className="btn btn-primary flex items-center gap-2">
          <span>+</span>
          <span>NEW PROPOSAL</span>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "pending", "under_review", "revision", "approved", "rejected"].map(
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
              {status === "all"
                ? "ALL"
                : STATUS_STYLES[status]?.label || status.toUpperCase()}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl text-gold animate-spin-slow mb-4">&#9881;</div>
          <p className="font-mono text-muted animate-pulse">LOADING PROPOSALS...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="card-document p-12 text-center">
          <div className="text-4xl text-gold-dim mb-4">&#9830;</div>
          <p className="font-mono text-muted">NO PROPOSALS FOUND</p>
          <Link href="/proposals/new" className="inline-block mt-4 btn btn-secondary">
            Submit Your First Proposal
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              isReviewer={isReviewer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalCard({
  proposal,
  isReviewer,
}: {
  proposal: Proposal;
  isReviewer: boolean;
}) {
  const statusStyle = STATUS_STYLES[proposal.status] || {
    label: proposal.status.toUpperCase(),
    class: "badge-secondary",
  };

  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className="block card-document p-4 hover:border-border-medium transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-display text-lg text-primary">{proposal.name}</h3>
            <span className={`badge ${statusStyle.class}`}>{statusStyle.label}</span>
          </div>

          {proposal.codename && (
            <p className="font-mono text-sm text-gold-dim mb-2">
              Codename: {proposal.codename}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
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
              THREAT: <span className="text-secondary">{proposal.threatLevel.toUpperCase()}</span>
            </span>
            {isReviewer && proposal.submitterName && (
              <span className="text-muted">
                BY: <span className="text-secondary">{proposal.submitterName}</span>
              </span>
            )}
            <span className="text-muted">
              {new Date(proposal.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="text-gold text-xl">&#8594;</div>
      </div>
    </Link>
  );
}
