"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  minClearance?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "◉" },
  { label: "Projects", href: "/projects", icon: "⬡" },
  { label: "Proposals", href: "/proposals", icon: "◆" },
  { label: "Reports", href: "/reports", icon: "◈", minClearance: 2 },
  { label: "Letters", href: "/letters", icon: "✉" },
  { label: "Personnel", href: "/personnel", icon: "⚉", minClearance: 3 },
  { label: "Invitations", href: "/invitations", icon: "◇", minClearance: 4 },
  { label: "Administration", href: "/admin", icon: "⚙", minClearance: 5 },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const clearance = session?.user?.clearanceLevel ?? 0;
  const [isCovenantMember, setIsCovenantMember] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/covenant/members")
        .then((res) => {
          if (res.ok) {
            setIsCovenantMember(true);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const isCovenantOnly = clearance === 0 && isCovenantMember;

  const visibleItems = isCovenantOnly
    ? [] // Hide all regular nav for covenant-only members
    : NAV_ITEMS.filter(
        (item) => !item.minClearance || clearance >= item.minClearance
      );

  return (
    <nav className="bg-panel border-r border-dark w-56 min-h-[calc(100vh-4rem)] py-4">
      {!isCovenantOnly && (
        <>
          <div className="px-3 mb-4">
            <span className="font-mono text-[0.6rem] text-dim tracking-widest">
              NAVIGATION
            </span>
          </div>

          <ul className="space-y-1 px-2">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 font-mono text-sm transition-all",
                      isActive
                        ? "bg-elevated border-l-2 border-gold text-gold"
                        : "text-secondary hover:bg-elevated hover:text-primary border-l-2 border-transparent"
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="tracking-wide">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {isCovenantMember && (
        <div className="mt-6 px-2">
          <div className="px-3 mb-2">
            <span className="font-mono text-[0.6rem] text-amber-500/50 tracking-widest">
              ⛧ ORDO SERPENTIUS ⛧
            </span>
          </div>
          <Link
            href="/covenant"
            className={cn(
              "flex items-center gap-3 px-3 py-2 font-mono text-sm transition-all",
              pathname.startsWith("/covenant")
                ? "bg-amber-500/10 border-l-2 border-amber-500 text-amber-500"
                : "text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-500 border-l-2 border-transparent"
            )}
          >
            <span className="text-lg">☉</span>
            <span className="tracking-wide">Ordo Serpentius</span>
          </Link>
        </div>
      )}

      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="divider-gradient mb-4" />
        <div className="text-center">
          <span className="font-mono text-[0.55rem] text-dim">
            THE SERPENT DEVOURS ITSELF
          </span>
        </div>
      </div>
    </nav>
  );
}
