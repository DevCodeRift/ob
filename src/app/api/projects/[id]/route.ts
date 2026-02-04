import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import {
  projects,
  projectAssignments,
  projectAccessRules,
  projectProposals,
  users,
  departments,
  logbookEntries,
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

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

    const [project] = await db
      .select({
        id: projects.id,
        projectCode: projects.projectCode,
        name: projects.name,
        codename: projects.codename,
        objectClass: projects.objectClass,
        securityClass: projects.securityClass,
        threatLevel: projects.threatLevel,
        status: projects.status,
        description: projects.description,
        containmentProcedures: projects.containmentProcedures,
        researchProtocols: projects.researchProtocols,
        progress: projects.progress,
        siteAssignment: projects.siteAssignment,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        departmentId: projects.departmentId,
        departmentName: departments.name,
        departmentIcon: departments.iconSymbol,
      })
      .from(projects)
      .leftJoin(departments, eq(projects.departmentId, departments.id))
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

    const [entryCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(logbookEntries)
      .where(eq(logbookEntries.projectId, id));

    const accessRules = await db
      .select({
        id: projectAccessRules.id,
        accessType: projectAccessRules.accessType,
        targetId: projectAccessRules.targetId,
        minClearance: projectAccessRules.minClearance,
        role: projectAccessRules.role,
        createdAt: projectAccessRules.createdAt,
        targetName: users.displayName,
        departmentName: departments.name,
      })
      .from(projectAccessRules)
      .leftJoin(users, eq(projectAccessRules.targetId, users.id))
      .leftJoin(departments, eq(projectAccessRules.targetId, departments.id))
      .where(eq(projectAccessRules.projectId, id));

    const [approvalInfo] = await db
      .select({
        proposalId: projectProposals.id,
        approvedBy: projectProposals.reviewedBy,
        approvedAt: projectProposals.reviewedAt,
        approverName: users.displayName,
        approverTitle: users.title,
      })
      .from(projectProposals)
      .leftJoin(users, eq(projectProposals.reviewedBy, users.id))
      .where(eq(projectProposals.createdProjectId, id));

    const leadResearcher = assignments.find((a) => a.role === "lead");

    return NextResponse.json({
      ...project,
      team: assignments,
      logbookEntryCount: Number(entryCount?.count || 0),
      accessRules,
      approvalInfo: approvalInfo || null,
      leadResearcher: leadResearcher || null,
    });
  } catch (error) {
    console.error("Project fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    if (session.user.clearanceLevel < 5) {
      const [assignment] = await db
        .select()
        .from(projectAssignments)
        .where(
          and(
            eq(projectAssignments.projectId, id),
            eq(projectAssignments.userId, session.user.id)
          )
        );

      if (!assignment || (assignment.role !== "lead" && assignment.role !== "researcher")) {
        return NextResponse.json(
          { error: "Not authorized to edit this project" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      name,
      codename,
      objectClass,
      securityClass,
      threatLevel,
      status,
      description,
      containmentProcedures,
      researchProtocols,
      progress,
      siteAssignment,
    } = body;

    if (securityClass && securityClass !== project.securityClass) {
      const newRequiredClearance = SECURITY_CLEARANCE_MAP[securityClass] || 1;
      if (session.user.clearanceLevel < newRequiredClearance) {
        return NextResponse.json(
          { error: "Insufficient clearance for new security class" },
          { status: 403 }
        );
      }
    }

    const [updated] = await db
      .update(projects)
      .set({
        name: name ?? project.name,
        codename: codename ?? project.codename,
        objectClass: objectClass ?? project.objectClass,
        securityClass: securityClass ?? project.securityClass,
        threatLevel: threatLevel ?? project.threatLevel,
        status: status ?? project.status,
        description: description ?? project.description,
        containmentProcedures: containmentProcedures ?? project.containmentProcedures,
        researchProtocols: researchProtocols ?? project.researchProtocols,
        progress: progress ?? project.progress,
        siteAssignment: siteAssignment ?? project.siteAssignment,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Project update error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
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

    if (session.user.clearanceLevel < 5) {
      return NextResponse.json(
        { error: "Only Archmagos can expunge projects" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const [updated] = await db
      .update(projects)
      .set({
        status: "expunged",
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Project expunged", project: updated });
  } catch (error) {
    console.error("Project deletion error:", error);
    return NextResponse.json(
      { error: "Failed to expunge project" },
      { status: 500 }
    );
  }
}
