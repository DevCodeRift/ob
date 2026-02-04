"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  pendingApplications: number;
  pendingProposals: number;
  activeProjects: number;
  pendingReports: number;
  activeInvitations: number;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    if (clearance < 5) {
      router.push("/dashboard");
      return;
    }
    setStats({
      totalUsers: 0,
      activeUsers: 0,
      pendingApplications: 0,
      pendingProposals: 0,
      activeProjects: 0,
      pendingReports: 0,
      activeInvitations: 0,
    });
  }, [clearance, router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-gold tracking-wide">
          ⚙ Administration
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          ARCHMAGOS CONTROL PANEL
        </p>
      </div>

      <div className="alert-banner alert-danger">
        <span className="text-xl mr-3">⚠</span>
        <span className="font-mono">
          LEVEL 5 CLEARANCE REQUIRED - ALL ACTIONS ARE LOGGED
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard label="TOTAL USERS" value={stats?.totalUsers ?? 0} icon="⚉" />
        <StatCard label="ACTIVE USERS" value={stats?.activeUsers ?? 0} icon="◉" color="green" />
        <StatCard label="PENDING APPS" value={stats?.pendingApplications ?? 0} icon="☲" color="gold" />
        <StatCard label="PROPOSALS" value={stats?.pendingProposals ?? 0} icon="◆" color="gold" />
        <StatCard label="PROJECTS" value={stats?.activeProjects ?? 0} icon="⬡" />
        <StatCard label="PENDING REPORTS" value={stats?.pendingReports ?? 0} icon="◈" color="gold" />
        <StatCard label="INVITATIONS" value={stats?.activeInvitations ?? 0} icon="◇" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminCard
          href="/admin/users"
          icon="⚉"
          title="User Management"
          description="View, edit, and manage all personnel records"
        />
        <AdminCard
          href="/admin/applications"
          icon="☲"
          title="Applications"
          description="Review recruitment applications"
        />
        <AdminCard
          href="/invitations"
          icon="◇"
          title="Invitations"
          description="Create and manage access invitations"
        />
        <AdminCard
          href="/admin/proposals"
          icon="◆"
          title="Proposal Review"
          description="Review and approve project proposals"
        />
        <AdminCard
          href="/admin/departments"
          icon="⛧"
          title="Departments"
          description="Configure organizational departments"
        />
        <AdminCard
          href="/admin/projects"
          icon="⬡"
          title="All Projects"
          description="View and manage all research projects"
        />
        <AdminCard
          href="/admin/logs"
          icon="☰"
          title="Activity Logs"
          description="View system activity and audit logs"
        />
      </div>

      <div className="card-document">
        <div className="bg-dark border-b border-border-dark px-5 py-3">
          <span className="font-mono text-xs text-gold tracking-widest">
            ⚡ QUICK ACTIONS
          </span>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/invitations"
            className="btn btn-secondary text-center"
          >
            + NEW INVITATION
          </Link>
          <Link
            href="/admin/users"
            className="btn btn-secondary text-center"
          >
            + NEW USER
          </Link>
          <Link
            href="/projects/new"
            className="btn btn-secondary text-center"
          >
            + NEW PROJECT
          </Link>
          <button className="btn btn-secondary">
            ⚙ SYSTEM STATUS
          </button>
        </div>
      </div>

      <div className="card-document">
        <div className="bg-dark border-b border-border-dark px-5 py-3">
          <span className="font-mono text-xs text-gold tracking-widest">
            ◇ SYSTEM INFORMATION
          </span>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          <div>
            <span className="text-muted block">VERSION</span>
            <span className="text-secondary">COGITATOR v2.0.7</span>
          </div>
          <div>
            <span className="text-muted block">NODE</span>
            <span className="text-secondary">PRIME-ALPHA-7</span>
          </div>
          <div>
            <span className="text-muted block">STATUS</span>
            <span className="text-class-green">OPERATIONAL</span>
          </div>
          <div>
            <span className="text-muted block">MACHINE SPIRIT</span>
            <span className="text-class-green">APPEASED</span>
          </div>
        </div>
      </div>

      <div className="text-center binary-decoration py-4">
        ARCHMAGOS TERMINAL · OMNISSIAH PROTECTS
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = "default",
}: {
  label: string;
  value: number;
  icon: string;
  color?: "default" | "green" | "gold" | "danger";
}) {
  const colorClasses = {
    default: "text-gold",
    green: "text-class-green",
    gold: "text-gold",
    danger: "text-danger",
  };

  return (
    <div className="card-document p-4 text-center">
      <span className="text-2xl text-gold-dim">{icon}</span>
      <p className={`font-mono text-3xl mt-2 ${colorClasses[color]}`}>{value}</p>
      <p className="font-mono text-[0.6rem] text-muted mt-1">{label}</p>
    </div>
  );
}

function AdminCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <article className="card-document p-5 hover:border-border-medium transition-all cursor-pointer group h-full">
        <div className="flex items-start gap-4">
          <span className="text-3xl text-gold-dim group-hover:text-gold transition-colors">
            {icon}
          </span>
          <div>
            <h3 className="font-mono text-lg text-primary group-hover:text-gold transition-colors">
              {title}
            </h3>
            <p className="font-mono text-xs text-muted mt-1">{description}</p>
          </div>
        </div>
      </article>
    </Link>
  );
}
