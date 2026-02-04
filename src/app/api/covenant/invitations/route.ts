import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { covenantInvitations, covenantMembers, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

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

    if (!membership || !["sovereign", "keeper"].includes(membership.covenantRole)) {
      return NextResponse.json(
        { error: "Only Sovereigns and Keepers of the Order may access this" },
        { status: 403 }
      );
    }

    const invitations = await db
      .select({
        id: covenantInvitations.id,
        token: covenantInvitations.token,
        targetName: covenantInvitations.targetName,
        proposedTitle: covenantInvitations.proposedTitle,
        proposedRole: covenantInvitations.proposedRole,
        invocationText: covenantInvitations.invocationText,
        createdAt: covenantInvitations.createdAt,
        expiresAt: covenantInvitations.expiresAt,
        acceptedAt: covenantInvitations.acceptedAt,
        createdByName: users.displayName,
      })
      .from(covenantInvitations)
      .leftJoin(users, eq(covenantInvitations.createdBy, users.id))
      .orderBy(desc(covenantInvitations.createdAt));

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Covenant invitations list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [membership] = await db
      .select()
      .from(covenantMembers)
      .where(eq(covenantMembers.userId, session.user.id));

    if (!membership || membership.covenantRole !== "sovereign") {
      return NextResponse.json(
        { error: "Only a Sovereign of the Order may extend invitations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      targetName,
      proposedTitle,
      proposedRole = "aspirant",
      proposedSignil,
      invocationText,
      targetUserId,
      expiresInDays = 30,
    } = body;

    if (!targetName || !proposedTitle) {
      return NextResponse.json(
        { error: "Target name and proposed title are required" },
        { status: 400 }
      );
    }

    const token = randomBytes(48).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const [invitation] = await db
      .insert(covenantInvitations)
      .values({
        token,
        targetUserId: targetUserId || null,
        targetName,
        proposedTitle,
        proposedRole,
        proposedSignil: proposedSignil || null,
        invocationText: invocationText || null,
        createdBy: session.user.id,
        expiresAt,
      })
      .returning();

    return NextResponse.json({
      invitation,
      inviteUrl: `/covenant/initiation/${token}`,
    }, { status: 201 });
  } catch (error) {
    console.error("Covenant invitation creation error:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
