import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import {
  users,
  departments,
  projectAssignments,
  projects,
  departmentMembers,
  ranks,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

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
    const userClearance = session.user.clearanceLevel;
    const isOwnProfile = session.user.id === id;

    const [userData] = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        username: users.username,
        email: users.email,
        title: users.title,
        designation: users.designation,
        clearanceLevel: users.clearanceLevel,
        profileImage: users.profileImage,
        bio: users.bio,
        specializations: users.specializations,
        isActive: users.isActive,
        isVerified: users.isVerified,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        departmentId: users.primaryDepartmentId,
        departmentName: departments.name,
        departmentIcon: departments.iconSymbol,
        departmentColor: departments.color,
      })
      .from(users)
      .leftJoin(departments, eq(users.primaryDepartmentId, departments.id))
      .where(eq(users.id, id));

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = {
      ...userData,
      email: isOwnProfile || userClearance >= 5 ? userData.email : null,
      lastLoginAt: userClearance >= 4 ? userData.lastLoginAt : null,
      createdAt: userClearance >= 4 ? userData.createdAt : null,
    };

    const assignedProjects = await db
      .select({
        id: projects.id,
        projectCode: projects.projectCode,
        name: projects.name,
        role: projectAssignments.role,
        securityClass: projects.securityClass,
      })
      .from(projectAssignments)
      .innerJoin(projects, eq(projectAssignments.projectId, projects.id))
      .where(
        and(
          eq(projectAssignments.userId, id),
          eq(projects.status, "active")
        )
      )
      .orderBy(desc(projectAssignments.assignedAt));

    const SECURITY_CLEARANCE_MAP: Record<string, number> = {
      GREEN: 1,
      AMBER: 2,
      RED: 4,
      BLACK: 5,
    };

    const visibleProjects = assignedProjects.filter(
      (p) => userClearance >= (SECURITY_CLEARANCE_MAP[p.securityClass] || 1)
    );

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
        assignedAt: departmentMembers.assignedAt,
      })
      .from(departmentMembers)
      .innerJoin(departments, eq(departmentMembers.departmentId, departments.id))
      .leftJoin(ranks, eq(departmentMembers.rankId, ranks.id))
      .where(eq(departmentMembers.userId, id))
      .orderBy(desc(ranks.sortOrder));

    return NextResponse.json({
      ...user,
      projects: visibleProjects,
      divisionMemberships: memberships,
    });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
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
    const isOwnProfile = session.user.id === id;
    const isAdmin = session.user.clearanceLevel >= 5;

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();

    const selfUpdateable = ["bio", "specializations", "profileImage"];
    const adminOnly = [
      "displayName",
      "title",
      "designation",
      "clearanceLevel",
      "primaryDepartmentId",
      "isActive",
      "isVerified",
      "password",
    ];

    const updateData: Record<string, any> = {};

    for (const field of selfUpdateable) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (isAdmin) {
      for (const field of adminOnly) {
        if (body[field] !== undefined) {
          if (field === "password") {
            updateData.passwordHash = await bcrypt.hash(body[field], 12);
          } else {
            updateData[field] = body[field];
          }
        }
      }
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        displayName: users.displayName,
        title: users.title,
        designation: users.designation,
        clearanceLevel: users.clearanceLevel,
        isActive: users.isActive,
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
