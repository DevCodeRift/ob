import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { projects, projectAssignments, users, departments } from "@/lib/db/schema";
import { eq, desc, and, or, gte, sql } from "drizzle-orm";

const SECURITY_CLEARANCE_MAP: Record<string, number> = {
  GREEN: 1,
  AMBER: 2,
  RED: 4,
  BLACK: 5,
};

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userClearance = session.user.clearanceLevel;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const security = searchParams.get("security");

    const projectsList = await db
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
        progress: projects.progress,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        departmentName: departments.name,
        departmentIcon: departments.iconSymbol,
      })
      .from(projects)
      .leftJoin(departments, eq(projects.departmentId, departments.id))
      .where(
        and(
          or(
            eq(projects.securityClass, "GREEN"),
            userClearance >= 2 ? eq(projects.securityClass, "AMBER") : undefined,
            userClearance >= 4 ? eq(projects.securityClass, "RED") : undefined,
            userClearance >= 5 ? eq(projects.securityClass, "BLACK") : undefined
          ),
          status ? eq(projects.status, status as any) : undefined,
          security ? eq(projects.securityClass, security as any) : undefined
        )
      )
      .orderBy(desc(projects.updatedAt));

    return NextResponse.json(projectsList);
  } catch (error) {
    console.error("Projects list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
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

    if (session.user.clearanceLevel < 3) {
      return NextResponse.json(
        { error: "Insufficient clearance level" },
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
      departmentId,
      siteAssignment,
      description,
      containmentProcedures,
      researchProtocols,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const requiredClearance = SECURITY_CLEARANCE_MAP[securityClass] || 1;
    if (session.user.clearanceLevel < requiredClearance) {
      return NextResponse.json(
        { error: "Insufficient clearance for this security class" },
        { status: 403 }
      );
    }

    const year = new Date().getFullYear();
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects);
    const count = Number(countResult[0]?.count || 0) + 1;
    const projectCode = `ORB-${year}-${String(count).padStart(4, "0")}`;

    const [newProject] = await db
      .insert(projects)
      .values({
        projectCode,
        name,
        codename,
        objectClass,
        securityClass,
        threatLevel,
        departmentId,
        siteAssignment,
        description,
        containmentProcedures,
        researchProtocols,
        createdBy: session.user.id,
      })
      .returning();

    await db.insert(projectAssignments).values({
      projectId: newProject.id,
      userId: session.user.id,
      role: "lead",
      assignedBy: session.user.id,
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
