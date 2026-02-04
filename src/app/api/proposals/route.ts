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
import { eq, desc, or } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clearance = session.user.clearanceLevel ?? 0;
    const isReviewer = clearance >= 4;

    let proposalsList;
    if (isReviewer) {
      proposalsList = await db
        .select({
          id: projectProposals.id,
          name: projectProposals.name,
          codename: projectProposals.codename,
          securityClass: projectProposals.securityClass,
          threatLevel: projectProposals.threatLevel,
          status: projectProposals.status,
          submittedBy: projectProposals.submittedBy,
          submitterName: users.displayName,
          createdAt: projectProposals.createdAt,
          updatedAt: projectProposals.updatedAt,
        })
        .from(projectProposals)
        .leftJoin(users, eq(projectProposals.submittedBy, users.id))
        .orderBy(desc(projectProposals.createdAt));
    } else {
      proposalsList = await db
        .select({
          id: projectProposals.id,
          name: projectProposals.name,
          codename: projectProposals.codename,
          securityClass: projectProposals.securityClass,
          threatLevel: projectProposals.threatLevel,
          status: projectProposals.status,
          submittedBy: projectProposals.submittedBy,
          submitterName: users.displayName,
          createdAt: projectProposals.createdAt,
          updatedAt: projectProposals.updatedAt,
        })
        .from(projectProposals)
        .leftJoin(users, eq(projectProposals.submittedBy, users.id))
        .where(eq(projectProposals.submittedBy, session.user.id))
        .orderBy(desc(projectProposals.createdAt));
    }

    return NextResponse.json(proposalsList);
  } catch (error) {
    console.error("Proposals list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
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

    const clearance = session.user.clearanceLevel ?? 0;
    if (clearance < 1) {
      return NextResponse.json(
        { error: "Clearance Level 1+ required to submit proposals" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      codename,
      objectClass,
      securityClass = "GREEN",
      threatLevel = "low",
      siteAssignment,
      description,
      containmentProcedures,
      researchProtocols,
      justification,
      estimatedResources,
      proposedTimeline,
      departmentIds = [],
      clearanceRequirements = [],
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const [newProposal] = await db
      .insert(projectProposals)
      .values({
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
        submittedBy: session.user.id,
        status: "pending",
      })
      .returning();

    if (departmentIds.length > 0) {
      await db.insert(proposalDepartments).values(
        departmentIds.map((d: { departmentId: string; isPrimary?: boolean }) => ({
          proposalId: newProposal.id,
          departmentId: d.departmentId,
          isPrimary: d.isPrimary || false,
        }))
      );
    }

    if (clearanceRequirements.length > 0) {
      await db.insert(proposalClearanceRequirements).values(
        clearanceRequirements.map((c: { clearanceLevel: number; description?: string }) => ({
          proposalId: newProposal.id,
          clearanceLevel: c.clearanceLevel,
          description: c.description,
        }))
      );
    }

    return NextResponse.json(newProposal, { status: 201 });
  } catch (error) {
    console.error("Proposal creation error:", error);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 500 }
    );
  }
}
