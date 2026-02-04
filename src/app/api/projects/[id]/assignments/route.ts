import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { projectAssignments, projects, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const SECURITY_CLEARANCE_MAP: Record<string, number> = {
  GREEN: 1,
  AMBER: 2,
  RED: 4,
  BLACK: 5,
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const assignments = await db
      .select({
        id: projectAssignments.id,
        role: projectAssignments.role,
        assignedAt: projectAssignments.assignedAt,
        userId: users.id,
        userName: users.displayName,
        userTitle: users.title,
        userDesignation: users.designation,
        userClearance: users.clearanceLevel,
      })
      .from(projectAssignments)
      .innerJoin(users, eq(projectAssignments.userId, users.id))
      .where(eq(projectAssignments.projectId, id));

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Assignments fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
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

    const { id } = await params;

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const requiredClearance = SECURITY_CLEARANCE_MAP[project.securityClass] || 1;
    if (session.user.clearanceLevel < requiredClearance) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    if (session.user.clearanceLevel < 4) {
      const [myAssignment] = await db
        .select()
        .from(projectAssignments)
        .where(
          and(
            eq(projectAssignments.projectId, id),
            eq(projectAssignments.userId, session.user.id)
          )
        );

      if (!myAssignment || myAssignment.role !== "lead") {
        return NextResponse.json(
          { error: "Only project leads can assign members" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { userId, role = "researcher" } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.clearanceLevel < requiredClearance) {
      return NextResponse.json(
        { error: "User lacks sufficient clearance for this project" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(projectAssignments)
      .where(
        and(
          eq(projectAssignments.projectId, id),
          eq(projectAssignments.userId, userId)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(projectAssignments)
        .set({ role })
        .where(eq(projectAssignments.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    }

    const [newAssignment] = await db
      .insert(projectAssignments)
      .values({
        projectId: id,
        userId,
        role,
        assignedBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error("Assignment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (session.user.clearanceLevel < 4) {
      const [myAssignment] = await db
        .select()
        .from(projectAssignments)
        .where(
          and(
            eq(projectAssignments.projectId, id),
            eq(projectAssignments.userId, session.user.id)
          )
        );

      if (!myAssignment || myAssignment.role !== "lead") {
        return NextResponse.json(
          { error: "Only project leads can remove members" },
          { status: 403 }
        );
      }
    }

    await db
      .delete(projectAssignments)
      .where(
        and(
          eq(projectAssignments.projectId, id),
          eq(projectAssignments.userId, userId)
        )
      );

    return NextResponse.json({ message: "Assignment removed" });
  } catch (error) {
    console.error("Assignment deletion error:", error);
    return NextResponse.json(
      { error: "Failed to remove assignment" },
      { status: 500 }
    );
  }
}
