import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { departmentMembers, departments, ranks, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    const memberships = await db
      .select({
        id: departmentMembers.id,
        departmentId: departmentMembers.departmentId,
        departmentName: departments.name,
        departmentIcon: departments.iconSymbol,
        departmentColor: departments.color,
        rankId: departmentMembers.rankId,
        rankName: ranks.name,
        rankShortName: ranks.shortName,
        rankClearance: ranks.clearanceLevel,
        rankSortOrder: ranks.sortOrder,
        assignedAt: departmentMembers.assignedAt,
      })
      .from(departmentMembers)
      .innerJoin(departments, eq(departmentMembers.departmentId, departments.id))
      .leftJoin(ranks, eq(departmentMembers.rankId, ranks.id))
      .where(eq(departmentMembers.userId, userId));

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("Memberships fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memberships" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params;

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { departmentId, rankId } = body;

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    const department = await db.query.departments.findFirst({
      where: (departments, { eq }) => eq(departments.id, departmentId),
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    if (rankId) {
      const rank = await db.query.ranks.findFirst({
        where: (ranks, { and, eq }) =>
          and(eq(ranks.id, rankId), eq(ranks.departmentId, departmentId)),
      });

      if (!rank) {
        return NextResponse.json(
          { error: "Rank not found in this department" },
          { status: 404 }
        );
      }
    }

    const existing = await db.query.departmentMembers.findFirst({
      where: (departmentMembers, { and, eq }) =>
        and(
          eq(departmentMembers.userId, userId),
          eq(departmentMembers.departmentId, departmentId)
        ),
    });

    if (existing) {
      const [updated] = await db
        .update(departmentMembers)
        .set({ rankId, assignedBy: session.user.id })
        .where(eq(departmentMembers.id, existing.id))
        .returning();

      return NextResponse.json(updated);
    }

    const [newMembership] = await db
      .insert(departmentMembers)
      .values({
        userId,
        departmentId,
        rankId,
        assignedBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newMembership, { status: 201 });
  } catch (error) {
    console.error("Membership creation error:", error);
    return NextResponse.json(
      { error: "Failed to create membership" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(departmentMembers)
      .where(
        and(
          eq(departmentMembers.userId, userId),
          eq(departmentMembers.departmentId, departmentId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Membership deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete membership" },
      { status: 500 }
    );
  }
}
