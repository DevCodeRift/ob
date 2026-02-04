import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { covenantInvitations, covenantMembers, users } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const [invitation] = await db
      .select({
        id: covenantInvitations.id,
        targetName: covenantInvitations.targetName,
        proposedTitle: covenantInvitations.proposedTitle,
        proposedRole: covenantInvitations.proposedRole,
        proposedSignil: covenantInvitations.proposedSignil,
        invocationText: covenantInvitations.invocationText,
        expiresAt: covenantInvitations.expiresAt,
        acceptedAt: covenantInvitations.acceptedAt,
        targetUserId: covenantInvitations.targetUserId,
        hasCredentials: covenantInvitations.username,
        sovereignName: users.displayName,
        sovereignTitle: users.title,
      })
      .from(covenantInvitations)
      .leftJoin(users, eq(covenantInvitations.createdBy, users.id))
      .where(eq(covenantInvitations.token, token));

    if (!invitation) {
      return NextResponse.json(
        { error: "This summons does not exist in the ancient records" },
        { status: 404 }
      );
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: "This oath has already been sealed" },
        { status: 400 }
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "The stars have shifted. This summons has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      targetName: invitation.targetName,
      proposedTitle: invitation.proposedTitle,
      proposedRole: invitation.proposedRole,
      proposedSignil: invitation.proposedSignil,
      invocationText: invitation.invocationText,
      sovereignName: invitation.sovereignName,
      sovereignTitle: invitation.sovereignTitle,
      requiresCredentials: !invitation.targetUserId && !!invitation.hasCredentials,
    });
  } catch (error) {
    console.error("Covenant invitation validation error:", error);
    return NextResponse.json(
      { error: "The ancient wards prevent access" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { motto, sigil, username, password } = body;

    const [invitation] = await db
      .select()
      .from(covenantInvitations)
      .where(
        and(
          eq(covenantInvitations.token, token),
          isNull(covenantInvitations.acceptedAt),
          gt(covenantInvitations.expiresAt, new Date())
        )
      );

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired summons" },
        { status: 400 }
      );
    }

    let userId = invitation.targetUserId;

    if (!userId) {
      if (!username || !password) {
        return NextResponse.json(
          { error: "Username and password are required" },
          { status: 400 }
        );
      }

      const normalizedUsername = username.toLowerCase();
      if (!/^[a-z0-9_]+$/.test(normalizedUsername) || normalizedUsername.length < 3) {
        return NextResponse.json(
          { error: "Invalid username format" },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, normalizedUsername));

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [newUser] = await db
        .insert(users)
        .values({
          username: normalizedUsername,
          email: `${normalizedUsername}@covenant.ouroboros.foundation`,
          passwordHash,
          displayName: invitation.targetName,
          title: invitation.proposedTitle,
          clearanceLevel: 0,
          isActive: true,
          isVerified: true,
        })
        .returning({ id: users.id });

      userId = newUser.id;
    }

    const [membership] = await db
      .insert(covenantMembers)
      .values({
        userId,
        covenantTitle: invitation.proposedTitle,
        covenantRole: invitation.proposedRole,
        oathTakenAt: new Date(),
        inductedBy: invitation.createdBy,
        sigil: sigil || invitation.proposedSignil,
        motto: motto || null,
        isActive: true,
      })
      .returning();

    await db
      .update(covenantInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(covenantInvitations.id, invitation.id));

    return NextResponse.json({
      success: true,
      message: "The Order welcomes you",
      membership: {
        covenantTitle: membership.covenantTitle,
        covenantRole: membership.covenantRole,
      },
      canLogin: !invitation.targetUserId,
    });
  } catch (error) {
    console.error("Covenant acceptance error:", error);
    return NextResponse.json(
      { error: "The ritual has failed" },
      { status: 500 }
    );
  }
}
