import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { covenantMembers, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.clearanceLevel < 5) {
      return NextResponse.json(
        { error: "Only L5 clearance can initialize the Order" },
        { status: 403 }
      );
    }

    const existingSovereigns = await db
      .select({ count: sql<number>`count(*)` })
      .from(covenantMembers)
      .where(eq(covenantMembers.covenantRole, "sovereign"));

    if (Number(existingSovereigns[0]?.count || 0) > 0) {
      return NextResponse.json(
        { error: "A Sovereign already exists. Use the invitation system." },
        { status: 400 }
      );
    }

    const [existingMember] = await db
      .select()
      .from(covenantMembers)
      .where(eq(covenantMembers.userId, session.user.id));

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of the Order" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(eq(users.id, session.user.id));

    const [newMember] = await db
      .insert(covenantMembers)
      .values({
        userId: session.user.id,
        covenantTitle: "First Sovereign of the Order",
        covenantRole: "sovereign",
        oathTakenAt: new Date(),
        sigil: "☉",
        motto: "The serpent devours itself",
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `${user?.displayName || "You"} have been anointed as the First Sovereign of Ordo Serpentius`,
      member: newMember,
    });
  } catch (error) {
    console.error("Covenant init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize the Order" },
      { status: 500 }
    );
  }
}
