import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { applications, users, departments, ranks } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

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
    const status = searchParams.get("status");

    const applicationsList = await db
      .select({
        id: applications.id,
        discordHandle: applications.discordHandle,
        email: applications.email,
        proposedName: applications.proposedName,
        proposedTitle: applications.proposedTitle,
        username: applications.username,
        requestedDepartmentId: applications.requestedDepartmentId,
        requestedRankId: applications.requestedRankId,
        preferredDepartment: applications.preferredDepartment,
        motivation: applications.motivation,
        experience: applications.experience,
        referral: applications.referral,
        status: applications.status,
        adminNotes: applications.adminNotes,
        createdAt: applications.createdAt,
        reviewedAt: applications.reviewedAt,
        departmentName: departments.name,
        departmentIcon: departments.iconSymbol,
        departmentColor: departments.color,
        rankName: ranks.name,
        rankShortName: ranks.shortName,
        rankClearance: ranks.clearanceLevel,
      })
      .from(applications)
      .leftJoin(departments, eq(applications.requestedDepartmentId, departments.id))
      .leftJoin(ranks, eq(applications.requestedRankId, ranks.id))
      .where(status ? eq(applications.status, status as any) : undefined)
      .orderBy(desc(applications.createdAt));

    return NextResponse.json(applicationsList);
  } catch (error) {
    console.error("Applications list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      discordHandle,
      email,
      proposedName,
      proposedTitle,
      departmentId,
      rankId,
      username,
      password,
      motivation,
      experience,
      referral,
    } = body;

    if (!discordHandle || !proposedName) {
      return NextResponse.json(
        { error: "Discord handle and proposed name are required" },
        { status: 400 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.toLowerCase();
    if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
      return NextResponse.json(
        { error: "Username can only contain lowercase letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    if (normalizedUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, normalizedUsername));

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    const [existingAppUsername] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.username, normalizedUsername),
          eq(applications.status, "pending")
        )
      );

    if (existingAppUsername) {
      return NextResponse.json(
        { error: "Username is already taken by a pending application" },
        { status: 400 }
      );
    }

    const [existingApp] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.discordHandle, discordHandle),
          eq(applications.status, "pending")
        )
      );

    if (existingApp) {
      return NextResponse.json(
        { error: "You already have a pending application" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newApplication] = await db
      .insert(applications)
      .values({
        discordHandle,
        email,
        proposedName,
        proposedTitle,
        requestedDepartmentId: departmentId || null,
        requestedRankId: rankId || null,
        username: normalizedUsername,
        passwordHash,
        motivation,
        experience,
        referral,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        applicationId: newApplication.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Application submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
