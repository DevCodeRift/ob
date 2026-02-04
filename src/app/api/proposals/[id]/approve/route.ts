import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import {
  projectProposals,
  proposalDepartments,
  proposalClearanceRequirements,
  projects,
  projectDepartments,
  projectAccessRules,
  projectAssignments,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

async function generateProjectCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORB-${year}-`;

  const result = await db.execute(sql`
    SELECT project_code FROM projects
    WHERE project_code LIKE ${prefix + '%'}
    ORDER BY project_code DESC
    LIMIT 1
  `);

  let nextNumber = 1;
  if (result.rows.length > 0) {
    const lastCode = result.rows[0].project_code as string;
    const lastNumber = parseInt(lastCode.split("-")[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
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

    const clearance = session.user.clearanceLevel ?? 0;
    if (clearance < 4) {
      return NextResponse.json(
        { error: "Clearance Level 4+ required to approve proposals" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const [proposal] = await db
      .select()
      .from(projectProposals)
      .where(eq(projectProposals.id, id));

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (proposal.status === "approved") {
      return NextResponse.json(
        { error: "Proposal already approved", projectId: proposal.createdProjectId },
        { status: 400 }
      );
    }

    if (proposal.status === "rejected") {
      return NextResponse.json(
        { error: "Cannot approve a rejected proposal" },
        { status: 400 }
      );
    }

    const proposalDepts = await db
      .select()
      .from(proposalDepartments)
      .where(eq(proposalDepartments.proposalId, id));

    const clearanceReqs = await db
      .select()
      .from(proposalClearanceRequirements)
      .where(eq(proposalClearanceRequirements.proposalId, id));

    const projectCode = await generateProjectCode();

    const primaryDept = proposalDepts.find((d) => d.isPrimary);
    const primaryDeptId = primaryDept?.departmentId || proposalDepts[0]?.departmentId || null;

    const [newProject] = await db
      .insert(projects)
      .values({
        projectCode,
        name: proposal.name,
        codename: proposal.codename,
        objectClass: proposal.objectClass,
        securityClass: proposal.securityClass,
        threatLevel: proposal.threatLevel,
        departmentId: primaryDeptId,
        siteAssignment: proposal.siteAssignment,
        status: "active",
        description: proposal.description,
        containmentProcedures: proposal.containmentProcedures,
        researchProtocols: proposal.researchProtocols,
        progress: 0,
        createdBy: proposal.submittedBy,
      })
      .returning();

    if (proposalDepts.length > 0) {
      await db.insert(projectDepartments).values(
        proposalDepts.map((d) => ({
          projectId: newProject.id,
          departmentId: d.departmentId,
          isPrimary: d.isPrimary,
        }))
      );
    }

    if (clearanceReqs.length > 0) {
      await db.insert(projectAccessRules).values(
        clearanceReqs.map((c) => ({
          projectId: newProject.id,
          accessType: "clearance" as const,
          targetId: null,
          minClearance: c.clearanceLevel,
          role: "researcher" as const,
          createdBy: session.user.id,
        }))
      );
    }

    await db.insert(projectAssignments).values({
      projectId: newProject.id,
      userId: proposal.submittedBy,
      role: "lead",
      assignedBy: session.user.id,
    });

    await db
      .update(projectProposals)
      .set({
        status: "approved",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        createdProjectId: newProject.id,
        updatedAt: new Date(),
      })
      .where(eq(projectProposals.id, id));

    return NextResponse.json({
      success: true,
      project: newProject,
      message: `Project ${projectCode} created successfully`,
    });
  } catch (error) {
    console.error("Proposal approval error:", error);
    return NextResponse.json(
      { error: "Failed to approve proposal" },
      { status: 500 }
    );
  }
}
