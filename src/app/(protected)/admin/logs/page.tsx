"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ActivityLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminLogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const clearance = session?.user?.clearanceLevel ?? 0;

  useEffect(() => {
    if (clearance < 5) {
      router.push("/dashboard");
      return;
    }
    setLoading(false);
  }, [clearance, router]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-gold transition-colors mb-2"
        >
          ← RETURN TO ADMIN
        </Link>
        <h1 className="font-display text-2xl text-gold tracking-wide">
          ☰ Activity Logs
        </h1>
        <p className="font-mono text-xs text-muted mt-1">
          SYSTEM AUDIT TRAIL
        </p>
      </div>

      <div className="alert-banner alert-info">
        <span className="text-xl mr-3">◎</span>
        <span className="font-mono text-sm">
          Activity logging is being implemented. All sensitive operations are tracked.
        </span>
      </div>

      <div className="card-document">
        <div className="bg-dark border-b border-border-dark px-5 py-3 flex items-center justify-between">
          <span className="font-mono text-xs text-gold tracking-widest">
            ◈ RECENT ACTIVITY
          </span>
          <span className="font-mono text-xs text-muted">
            Last 24 hours
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
            <p className="font-mono text-muted animate-pulse">
              ACCESSING COGITATOR LOGS...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl text-gold-dim mb-4">☰</div>
            <p className="font-mono text-muted">
              NO ACTIVITY LOGGED YET
            </p>
            <p className="font-mono text-xs text-muted mt-2">
              System events will appear here as they occur
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-dark">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-elevated transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-sm text-gold">
                      {log.action}
                    </span>
                    {log.userName && (
                      <span className="font-mono text-sm text-secondary ml-2">
                        by {log.userName}
                      </span>
                    )}
                    {log.targetType && (
                      <span className="font-mono text-xs text-muted ml-2">
                        on {log.targetType}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                {log.ipAddress && (
                  <div className="font-mono text-xs text-muted mt-1">
                    IP: {log.ipAddress}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LogCategory
          icon="⚉"
          title="User Events"
          description="Logins, profile updates"
        />
        <LogCategory
          icon="⬡"
          title="Project Events"
          description="Creates, updates, assignments"
        />
        <LogCategory
          icon="◈"
          title="Report Events"
          description="Submissions, acknowledgments"
        />
        <LogCategory
          icon="⚙"
          title="Admin Events"
          description="Configuration changes"
        />
      </div>

      <div className="text-center binary-decoration py-4">
        COGITATOR AUDIT SYSTEM · ALL ACTIONS RECORDED
      </div>
    </div>
  );
}

function LogCategory({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card-document p-4 text-center">
      <span className="text-2xl text-gold-dim">{icon}</span>
      <p className="font-mono text-sm text-primary mt-2">{title}</p>
      <p className="font-mono text-xs text-muted mt-1">{description}</p>
    </div>
  );
}
