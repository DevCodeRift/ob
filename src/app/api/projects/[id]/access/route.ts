import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import {
  projectAccessRules,
  projects,
  users,
  departments,
  ranks,
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

    const { id: projectId } = await params;

    const project = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const rules = await db
      .select({
        id: projectAccessRules.id,
        accessType: projectAccessRules.accessType,
        targetId: projectAccessRules.targetId,
        minClearance: projectAccessRules.minClearance,
        role: projectAccessRules.role,
        createdAt: projectAccessRules.createdAt,
      })
      .from(projectAccessRules)
      .where(eq(projectAccessRules.projectId, projectId));

    const enrichedRules = await Promise.all(
      rules.map(async (rule) => {
        let targetName = "";
        let targetIcon = "";
        let targetColor = "";

        switch (rule.accessType) {
          case "user":
            if (rule.targetId) {
              const user = await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, rule.targetId!),
              });
              targetName = user?.displayName || "Unknown User";
            }
            break;

          case "department":
            if (rule.targetId) {
              const dept = await db.query.departments.findFirst({
                where: (departments, { eq }) => eq(departments.id, rule.targetId!),
              });
              targetName = dept?.name || "Unknown Department";
              targetIcon = dept?.iconSymbol || "";
              targetColor = dept?.color || "";
            }
            break;

          case "rank":
            if (rule.targetId) {
              const rank = await db
                .select({
                  rankName: ranks.name,
                  deptName: departments.name,
                  deptIcon: departments.iconSymbol,
                  deptColor: departments.color,
                })
                .from(ranks)
                .leftJoin(departments, eq(ranks.departmentId, departments.id))
                .where(eq(ranks.id, rule.targetId))
                .limit(1);

              if (rank.length > 0) {
                targetName = `${rank[0].rankName} (${rank[0].deptName})`;
                targetIcon = rank[0].deptIcon || "";
                targetColor = rank[0].deptColor || "";
              }
            }
            break;

          case "clearance":
            targetName = `Clearance Level ${rule.minClearance}+`;
            break;
        }

        return {
          ...rule,
          targetName,
          targetIcon,
          targetColor,
        };
      })
    );

    return NextResponse.json(enrichedRules);
  } catch (error) {
    console.error("Access rules list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch access rules" },
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

    const { id: projectId } = await params;

    const project = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isAuthorized =
      session.user.clearanceLevel >= 3 ||
      project.createdBy === session.user.id;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { accessType, targetId, minClearance, role } = body;

    if (!accessType) {
      return NextResponse.json(
        { error: "Access type is required" },
        { status: 400 }
      );
    }

    if (accessType === "clearance" && minClearance === undefined) {
      return NextResponse.json(
        { error: "Minimum clearance is required for clearance-based access" },
        { status: 400 }
      );
    }

    if (["user", "department", "rank"].includes(accessType) && !targetId) {
      return NextResponse.json(
        { error: "Target ID is required for this access type" },
        { status: 400 }
      );
    }

    const [newRule] = await db
      .insert(projectAccessRules)
      .values({
        projectId,
        accessType,
        targetId: accessType === "clearance" ? null : targetId,
        minClearance: accessType === "clearance" ? minClearance : null,
        role: role || "researcher",
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error("Access rule creation error:", error);
    return NextResponse.json(
      { error: "Failed to create access rule" },
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

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get("ruleId");

    if (!ruleId) {
      return NextResponse.json(
        { error: "Rule ID is required" },
        { status: 400 }
      );
    }

    const project = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isAuthorized =
      session.user.clearanceLevel >= 3 ||
      project.createdBy === session.user.id;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    await db
      .delete(projectAccessRules)
      .where(
        and(
          eq(projectAccessRules.id, ruleId),
          eq(projectAccessRules.projectId, projectId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Access rule deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete access rule" },
      { status: 500 }
    );
  }
}
