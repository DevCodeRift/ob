"use client";

import { useSession } from "next-auth/react";
import { getClearanceInfo } from "@/lib/constants/clearance";
import { useState, useEffect } from "react";
import Link from "next/link";

const STATUS_MESSAGES = [
  { text: "Noospheric link stable", type: "info" },
  { text: "Cogitator cycles optimal", type: "info" },
  { text: "Warding protocols active", type: "success" },
  { text: "Sector scan complete - no anomalies", type: "success" },
  { text: "Data-streams synchronized", type: "info" },
  { text: "Machine spirit appeased", type: "success" },
  { text: "Archival systems nominal", type: "info" },
  { text: "Encryption matrices holding", type: "success" },
];

const SYSTEM_DIAGNOSTICS = [
  { label: "NOOSPHERIC LINK", value: 98, status: "OPTIMAL" },
  { label: "COGITATOR LOAD", value: 42, status: "NOMINAL" },
  { label: "ARCHIVE INTEGRITY", value: 100, status: "PRISTINE" },
  { label: "WARD STRENGTH", value: 87, status: "STABLE" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const clearanceInfo = getClearanceInfo(user?.clearanceLevel ?? 0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [terminalMessages, setTerminalMessages] = useState<typeof STATUS_MESSAGES>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const addMessage = () => {
      const randomMsg = STATUS_MESSAGES[Math.floor(Math.random() * STATUS_MESSAGES.length)];
      setTerminalMessages(prev => [...prev.slice(-4), randomMsg]);
    };

    addMessage();
    const timer = setInterval(addMessage, 5000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="bg-dark border border-border-dark p-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-class-green animate-pulse" />
            <span className="font-terminal text-xs text-class-green">SYSTEM ACTIVE</span>
          </div>
          <div className="h-4 w-px bg-border-medium" />
          <span className="font-terminal text-xs text-muted">
            NODE: PRIME-ALPHA-7
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-terminal text-xs text-gold">{formatDate(currentTime)}</span>
          <span className="font-terminal text-sm text-gold-bright tracking-widest">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="card-document overflow-hidden">
            <div className="p-6 relative">
              <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-gold-dim" />
              <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-gold-dim" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-gold-dim" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-gold-dim" />

              <div className="text-center relative z-10">
                <div className="inline-block mb-4 relative">
                  <div className="text-5xl text-gold animate-breathe">☉</div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 font-terminal text-[0.6rem] text-gold-dim">
                    ⛧ ⛧ ⛧
                  </div>
                </div>

                <p className="font-terminal text-[0.6rem] text-muted tracking-[0.3em] mb-1">
                  DESIGNATED OPERATIVE
                </p>

                <h2 className="font-display text-2xl text-gold tracking-wide mb-1">
                  {user?.name || user?.username}
                </h2>

                {user?.title && (
                  <p className="font-body text-secondary italic">{user.title}</p>
                )}

                {user?.designation && (
                  <p className="font-terminal text-xs text-muted mt-2">
                    {user.designation}
                  </p>
                )}
              </div>
            </div>

            <div
              className="p-4 border-t border-border-dark text-center"
              style={{
                background: `linear-gradient(180deg, ${clearanceInfo.color}15, transparent)`,
                borderTopColor: clearanceInfo.color + '40'
              }}
            >
              <p className="font-terminal text-[0.6rem] text-muted tracking-widest mb-2">
                SECURITY CLEARANCE
              </p>
              <div
                className="inline-block px-6 py-3 border-2 animate-pulse-glow"
                style={{ borderColor: clearanceInfo.color }}
              >
                <span
                  className="font-display text-3xl tracking-wider"
                  style={{ color: clearanceInfo.color }}
                >
                  LEVEL {user?.clearanceLevel}
                </span>
              </div>
              <p
                className="font-terminal text-sm tracking-[0.2em] mt-3"
                style={{ color: clearanceInfo.color }}
              >
                {clearanceInfo.title.toUpperCase()}
              </p>
              <p className="font-terminal text-[0.6rem] text-muted mt-1">
                {clearanceInfo.description}
              </p>
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-header">
              <div className="terminal-dot active" />
              <span className="font-terminal text-xs text-gold-dim ml-2">
                SYSTEM STATUS
              </span>
            </div>
            <div className="p-4 space-y-2 h-[160px] overflow-hidden">
              {terminalMessages.map((msg, index) => (
                <div
                  key={index}
                  className="terminal-line text-xs animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className={`mr-2 ${msg.type === 'success' ? 'text-class-green' : 'text-gold-dim'}`}>
                    {msg.type === 'success' ? '✓' : '◈'}
                  </span>
                  <span className="text-text-secondary">{msg.text}</span>
                </div>
              ))}
              <div className="terminal-line">
                <span className="terminal-cursor" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gold">⚙</span>
                <span className="font-terminal text-xs text-gold tracking-widest">
                  SYSTEM DIAGNOSTICS
                </span>
              </div>
              <span className="font-terminal text-[0.6rem] text-class-green tracking-wider">
                ALL SYSTEMS NOMINAL
              </span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              {SYSTEM_DIAGNOSTICS.map((diag, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-terminal text-[0.65rem] text-muted tracking-wider">
                      {diag.label}
                    </span>
                    <span className="font-terminal text-[0.65rem] text-class-green">
                      {diag.status}
                    </span>
                  </div>
                  <div className="progress-bar h-2">
                    <div
                      className="progress-bar-fill h-full"
                      style={{ width: `${diag.value}%` }}
                    />
                  </div>
                  <div className="text-right">
                    <span className="font-terminal text-xs text-gold">{diag.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="ASSIGNED PROJECTS"
              value="0"
              icon="⬡"
              color="var(--gold-standard)"
              subtext="Active research"
            />
            <StatCard
              label="PENDING REPORTS"
              value="0"
              icon="◈"
              color="var(--brass)"
              subtext="Awaiting review"
            />
            <StatCard
              label="LOGBOOK ENTRIES"
              value="0"
              icon="☰"
              color="var(--cyan-glow)"
              subtext="Total recorded"
            />
            <StatCard
              label="SEALED LETTERS"
              value="0"
              icon="✉"
              color="var(--purple-mystic)"
              subtext="Dispatched"
            />
          </div>

          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3 flex items-center gap-3">
              <span className="text-gold">◇</span>
              <span className="font-terminal text-xs text-gold tracking-widest">
                COMMAND INTERFACE
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <ActionButton href="/projects" label="Projects" icon="⬡" description="View research" />
                <ActionButton href="/reports/new" label="New Report" icon="◈" description="Submit findings" />
                <ActionButton href="/letters/new" label="Compose" icon="✉" description="Draft letter" />
                <ActionButton href="/personnel" label="Personnel" icon="☺" description="View directory" />
              </div>

              {(user?.clearanceLevel ?? 0) >= 4 && (
                <>
                  <div className="divider-gradient my-5" />
                  <p className="font-terminal text-[0.6rem] text-gold-dim mb-3 tracking-widest">
                    ELEVATED CLEARANCE ACTIONS
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <ActionButton href="/invitations" label="Invitations" icon="◆" description="Manage access" />
                    <ActionButton href="/admin/applications" label="Applications" icon="☲" description="Review recruits" />
                    {(user?.clearanceLevel ?? 0) >= 5 && (
                      <>
                        <ActionButton href="/admin" label="Admin" icon="⛧" description="System control" />
                        <ActionButton href="/admin/users" label="Users" icon="☺" description="Manage personnel" />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden border border-gold-dim/30 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 p-6">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-dim to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-dim to-transparent" />

            <div className="flex items-start gap-4">
              <div className="text-4xl text-gold animate-breathe">☉</div>
              <div>
                <p className="font-display text-xl text-gold tracking-wide mb-2">
                  The Omnissiah Protects
                </p>
                <p className="font-body text-secondary leading-relaxed">
                  Through knowledge and vigilance, we secure the future. Your dedication
                  to the Foundation&apos;s mission ensures the sanctity of our work.
                  May the Machine Spirit guide your endeavors.
                </p>
                <p className="latin-phrase text-sm mt-4">
                  Ex tenebris, scientia. Ex machina, salvatio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center binary-decoration py-4">
        01001111 01010101 01010010 01001111 01000010 01001111 01010010 01001111 01010011 · FOUNDATION ARCHIVES · 01010011 01000101 01000011 01010101 01010010 01000101
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  subtext,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  subtext: string;
}) {
  return (
    <div className="card-document p-4 group hover:border-border-medium transition-all">
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-2xl transition-transform group-hover:scale-110"
          style={{ color }}
        >
          {icon}
        </span>
        <span
          className="font-terminal text-3xl"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      <p className="font-terminal text-[0.6rem] text-muted tracking-wider">
        {label}
      </p>
      <p className="font-terminal text-[0.55rem] text-dim mt-1">
        {subtext}
      </p>
    </div>
  );
}

function ActionButton({
  href,
  label,
  icon,
  description,
}: {
  href: string;
  label: string;
  icon: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block p-4 bg-dark border border-border-dark hover:border-gold-dim hover:bg-elevated transition-all"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl text-gold-dim group-hover:text-gold transition-colors">
          {icon}
        </span>
        <span className="font-terminal text-sm text-text-primary group-hover:text-gold transition-colors">
          {label}
        </span>
      </div>
      <p className="font-terminal text-[0.6rem] text-muted group-hover:text-text-secondary transition-colors">
        {description}
      </p>
    </Link>
  );
}
