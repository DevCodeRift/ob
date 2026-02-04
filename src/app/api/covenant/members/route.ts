import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { covenantMembers, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [membership] = await db
      .select()
      .from(covenantMembers)
      .where(eq(covenantMembers.userId, session.user.id));

    if (!membership || !membership.isActive) {
      return NextResponse.json(
        { error: "The Order's secrets are not for outsiders" },
        { status: 403 }
      );
    }

    const members = await db
      .select({
        id: covenantMembers.id,
        covenantTitle: covenantMembers.covenantTitle,
        covenantRole: covenantMembers.covenantRole,
        sigil: covenantMembers.sigil,
        motto: covenantMembers.motto,
        oathTakenAt: covenantMembers.oathTakenAt,
        userId: users.id,
        displayName: users.displayName,
        title: users.title,
        profileImage: users.profileImage,
        lastLoginAt: users.lastLoginAt,
      })
      .from(covenantMembers)
      .innerJoin(users, eq(covenantMembers.userId, users.id))
      .where(eq(covenantMembers.isActive, true))
      .orderBy(
        desc(covenantMembers.covenantRole),
        covenantMembers.oathTakenAt
      );

    const roleOrder = { sovereign: 0, keeper: 1, initiate: 2, aspirant: 3 };
    const sortedMembers = members.sort(
      (a, b) => (roleOrder[a.covenantRole as keyof typeof roleOrder] ?? 4) -
                (roleOrder[b.covenantRole as keyof typeof roleOrder] ?? 4)
    );

    return NextResponse.json({
      members: sortedMembers,
      currentMember: membership,
    });
  } catch (error) {
    console.error("Covenant members list error:", error);
    return NextResponse.json(
      { error: "Failed to commune with the Order" },
      { status: 500 }
    );
  }
}
