"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { getClearanceInfo } from "@/lib/constants/clearance";

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const clearanceInfo = getClearanceInfo(user?.clearanceLevel ?? 0);

  return (
    <header className="bg-dark border-b border-dark sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="text-2xl text-gold">☉</span>
            <div>
              <span className="font-display text-lg text-gold tracking-wider">
                OUROBOROS
              </span>
              <span className="font-mono text-[0.6rem] text-muted block -mt-1 tracking-widest">
                FOUNDATION
              </span>
            </div>
          </Link>

          {user && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="font-mono text-sm text-primary">
                  {user.name || user.username}
                </p>
                <p
                  className="font-mono text-[0.65rem] tracking-wider"
                  style={{ color: clearanceInfo.color }}
                >
                  {clearanceInfo.title.toUpperCase()} - CLEARANCE{" "}
                  {user.clearanceLevel}
                </p>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn text-[0.65rem]"
              >
                DISCONNECT
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
