import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { invitations, users, departments, ranks } from "@/lib/db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.clearanceLevel < 4) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const showUsed = searchParams.get("showUsed") === "true";

    let invitationsList;

    try {
      invitationsList = await db
        .select({
          id: invitations.id,
          token: invitations.token,
          displayName: invitations.displayName,
          title: invitations.title,
          clearanceLevel: invitations.clearanceLevel,
          departmentId: invitations.departmentId,
          rankId: invitations.rankId,
          notes: invitations.notes,
          createdAt: invitations.createdAt,
          expiresAt: invitations.expiresAt,
          usedAt: invitations.usedAt,
          createdByName: users.displayName,
          departmentName: departments.name,
          departmentIcon: departments.iconSymbol,
          departmentColor: departments.color,
          rankName: ranks.name,
          rankShortName: ranks.shortName,
        })
        .from(invitations)
        .innerJoin(users, eq(invitations.createdBy, users.id))
        .leftJoin(departments, eq(invitations.departmentId, departments.id))
        .leftJoin(ranks, eq(invitations.rankId, ranks.id))
        .where(showUsed ? undefined : isNull(invitations.usedAt))
        .orderBy(desc(invitations.createdAt));
    } catch (rankError) {
      console.warn("Ranks query failed, falling back to basic query:", rankError);
      const basicList = await db
        .select({
          id: invitations.id,
          token: invitations.token,
          displayName: invitations.displayName,
          title: invitations.title,
          clearanceLevel: invitations.clearanceLevel,
          departmentId: invitations.departmentId,
          notes: invitations.notes,
          createdAt: invitations.createdAt,
          expiresAt: invitations.expiresAt,
          usedAt: invitations.usedAt,
          createdByName: users.displayName,
          departmentName: departments.name,
          departmentIcon: departments.iconSymbol,
          departmentColor: departments.color,
        })
        .from(invitations)
        .innerJoin(users, eq(invitations.createdBy, users.id))
        .leftJoin(departments, eq(invitations.departmentId, departments.id))
        .where(showUsed ? undefined : isNull(invitations.usedAt))
        .orderBy(desc(invitations.createdAt));

      invitationsList = basicList.map(inv => ({
        ...inv,
        rankId: null,
        rankName: null,
        rankShortName: null,
      }));
    }

    const now = new Date();
    const enrichedInvitations = invitationsList.map((inv) => ({
      ...inv,
      status: inv.usedAt
        ? "used"
        : new Date(inv.expiresAt) < now
        ? "expired"
        : "active",
    }));

    return NextResponse.json(enrichedInvitations);
  } catch (error) {
    console.error("Invitations list error:", error);
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

    if (session.user.clearanceLevel < 4) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      displayName,
      title,
      clearanceLevel = 1,
      departmentId,
      rankId,
      notes,
      expiresInDays = 7,
    } = body;

    if (!displayName) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    const maxInviteClearance =
      session.user.clearanceLevel >= 5
        ? 5
        : session.user.clearanceLevel - 1;

    if (clearanceLevel > maxInviteClearance) {
      return NextResponse.json(
        { error: "Cannot invite at this clearance level" },
        { status: 403 }
      );
    }

    const token = randomBytes(32).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    let newInvitation;

    try {
      [newInvitation] = await db
        .insert(invitations)
        .values({
          token,
          displayName,
          title,
          clearanceLevel,
          departmentId: departmentId || null,
          rankId: rankId || null,
          notes,
          createdBy: session.user.id,
          expiresAt,
        })
        .returning();
    } catch (insertError) {
      console.warn("Insert with rankId failed, trying without:", insertError);
      [newInvitation] = await db
        .insert(invitations)
        .values({
          token,
          displayName,
          title,
          clearanceLevel,
          departmentId: departmentId || null,
          notes,
          createdBy: session.user.id,
          expiresAt,
        } as typeof invitations.$inferInsert)
        .returning();
    }

    return NextResponse.json(newInvitation, { status: 201 });
  } catch (error) {
    console.error("Invitation creation error:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.clearanceLevel < 4) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Invitation ID required" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(invitations)
      .where(and(eq(invitations.id, id), isNull(invitations.usedAt)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Invitation not found or already used" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Invitation revoked" });
  } catch (error) {
    console.error("Invitation deletion error:", error);
    return NextResponse.json(
      { error: "Failed to revoke invitation" },
      { status: 500 }
    );
  }
}
