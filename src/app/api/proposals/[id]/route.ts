import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import {
  projectProposals,
  proposalDepartments,
  proposalClearanceRequirements,
  users,
  departments,
} from "@/lib/db/schema";
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

    const { id } = await params;
    const clearance = session.user.clearanceLevel ?? 0;
    const isReviewer = clearance >= 4;

    const [proposal] = await db
      .select({
        id: projectProposals.id,
        name: projectProposals.name,
        codename: projectProposals.codename,
        objectClass: projectProposals.objectClass,
        securityClass: projectProposals.securityClass,
        threatLevel: projectProposals.threatLevel,
        siteAssignment: projectProposals.siteAssignment,
        description: projectProposals.description,
        containmentProcedures: projectProposals.containmentProcedures,
        researchProtocols: projectProposals.researchProtocols,
        justification: projectProposals.justification,
        estimatedResources: projectProposals.estimatedResources,
        proposedTimeline: projectProposals.proposedTimeline,
        status: projectProposals.status,
        adminNotes: projectProposals.adminNotes,
        rejectionReason: projectProposals.rejectionReason,
        revisionNotes: projectProposals.revisionNotes,
        submittedBy: projectProposals.submittedBy,
        submitterName: users.displayName,
        reviewedBy: projectProposals.reviewedBy,
        reviewedAt: projectProposals.reviewedAt,
        createdProjectId: projectProposals.createdProjectId,
        createdAt: projectProposals.createdAt,
        updatedAt: projectProposals.updatedAt,
      })
      .from(projectProposals)
      .leftJoin(users, eq(projectProposals.submittedBy, users.id))
      .where(eq(projectProposals.id, id));

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const isOwner = proposal.submittedBy === session.user.id;
    if (!isOwner && !isReviewer) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const depts = await db
      .select({
        id: proposalDepartments.id,
        departmentId: proposalDepartments.departmentId,
        departmentName: departments.name,
        departmentIcon: departments.iconSymbol,
        departmentColor: departments.color,
        isPrimary: proposalDepartments.isPrimary,
      })
      .from(proposalDepartments)
      .leftJoin(departments, eq(proposalDepartments.departmentId, departments.id))
      .where(eq(proposalDepartments.proposalId, id));

    const clearanceReqs = await db
      .select()
      .from(proposalClearanceRequirements)
      .where(eq(proposalClearanceRequirements.proposalId, id));

    const response = {
      ...proposal,
      adminNotes: isReviewer ? proposal.adminNotes : null,
      departments: depts,
      clearanceRequirements: clearanceReqs,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Proposal fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposal" },
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
    const clearance = session.user.clearanceLevel ?? 0;
    const isReviewer = clearance >= 4;

    const [proposal] = await db
      .select()
      .from(projectProposals)
      .where(eq(projectProposals.id, id));

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const isOwner = proposal.submittedBy === session.user.id;
    const body = await request.json();

    if (isReviewer) {
      const {
        status,
        adminNotes,
        rejectionReason,
        revisionNotes,
      } = body;

      const updates: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (status) {
        updates.status = status;
        if (status !== proposal.status) {
          updates.reviewedBy = session.user.id;
          updates.reviewedAt = new Date();
        }
      }
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;
      if (rejectionReason !== undefined) updates.rejectionReason = rejectionReason;
      if (revisionNotes !== undefined) updates.revisionNotes = revisionNotes;

      const [updated] = await db
        .update(projectProposals)
        .set(updates)
        .where(eq(projectProposals.id, id))
        .returning();

      return NextResponse.json(updated);
    }

    if (isOwner) {
      if (proposal.status !== "pending" && proposal.status !== "revision") {
        return NextResponse.json(
          { error: "Can only edit proposals in pending or revision status" },
          { status: 403 }
        );
      }

      const {
        name,
        codename,
        objectClass,
        securityClass,
        threatLevel,
        siteAssignment,
        description,
        containmentProcedures,
        researchProtocols,
        justification,
        estimatedResources,
        proposedTimeline,
        departmentIds,
        clearanceRequirements,
      } = body;

      const updates: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (name !== undefined) updates.name = name;
      if (codename !== undefined) updates.codename = codename;
      if (objectClass !== undefined) updates.objectClass = objectClass;
      if (securityClass !== undefined) updates.securityClass = securityClass;
      if (threatLevel !== undefined) updates.threatLevel = threatLevel;
      if (siteAssignment !== undefined) updates.siteAssignment = siteAssignment;
      if (description !== undefined) updates.description = description;
      if (containmentProcedures !== undefined) updates.containmentProcedures = containmentProcedures;
      if (researchProtocols !== undefined) updates.researchProtocols = researchProtocols;
      if (justification !== undefined) updates.justification = justification;
      if (estimatedResources !== undefined) updates.estimatedResources = estimatedResources;
      if (proposedTimeline !== undefined) updates.proposedTimeline = proposedTimeline;

      if (proposal.status === "revision") {
        updates.status = "pending";
      }

      const [updated] = await db
        .update(projectProposals)
        .set(updates)
        .where(eq(projectProposals.id, id))
        .returning();

      if (departmentIds !== undefined) {
        await db
          .delete(proposalDepartments)
          .where(eq(proposalDepartments.proposalId, id));

        if (departmentIds.length > 0) {
          await db.insert(proposalDepartments).values(
            departmentIds.map((d: { departmentId: string; isPrimary?: boolean }) => ({
              proposalId: id,
              departmentId: d.departmentId,
              isPrimary: d.isPrimary || false,
            }))
          );
        }
      }

      if (clearanceRequirements !== undefined) {
        await db
          .delete(proposalClearanceRequirements)
          .where(eq(proposalClearanceRequirements.proposalId, id));

        if (clearanceRequirements.length > 0) {
          await db.insert(proposalClearanceRequirements).values(
            clearanceRequirements.map((c: { clearanceLevel: number; description?: string }) => ({
              proposalId: id,
              clearanceLevel: c.clearanceLevel,
              description: c.description,
            }))
          );
        }
      }

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  } catch (error) {
    console.error("Proposal update error:", error);
    return NextResponse.json(
      { error: "Failed to update proposal" },
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
    const clearance = session.user.clearanceLevel ?? 0;
    const isAdmin = clearance >= 5;

    const [proposal] = await db
      .select()
      .from(projectProposals)
      .where(eq(projectProposals.id, id));

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const isOwner = proposal.submittedBy === session.user.id;

    if (isAdmin) {
      await db.delete(projectProposals).where(eq(projectProposals.id, id));
      return NextResponse.json({ success: true });
    }

    if (isOwner && proposal.status === "pending") {
      await db.delete(projectProposals).where(eq(projectProposals.id, id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  } catch (error) {
    console.error("Proposal delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete proposal" },
      { status: 500 }
    );
  }
}
