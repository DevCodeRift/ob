import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { users, departments, ranks, departmentMembers } from "@/lib/db/schema";
import { eq, desc, and, gte, ilike, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userClearance = session.user.clearanceLevel;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const departmentId = searchParams.get("department");

    const usersData = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        username: users.username,
        title: users.title,
        designation: users.designation,
        clearanceLevel: users.clearanceLevel,
        profileImage: users.profileImage,
        bio: users.bio,
        specializations: users.specializations,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        departmentName: departments.name,
        departmentIcon: departments.iconSymbol,
        departmentColor: departments.color,
      })
      .from(users)
      .leftJoin(departments, eq(users.primaryDepartmentId, departments.id))
      .where(
        and(
          eq(users.isActive, true),
          departmentId ? eq(users.primaryDepartmentId, departmentId) : undefined,
          search
            ? or(
                ilike(users.displayName, `%${search}%`),
                ilike(users.username, `%${search}%`),
                ilike(users.title, `%${search}%`)
              )
            : undefined
        )
      )
      .orderBy(desc(users.clearanceLevel), users.displayName);

    const usersList = usersData.map((user) => ({
      ...user,
      bio: userClearance >= 3 ? user.bio : null,
      specializations: userClearance >= 3 ? user.specializations : null,
      lastLoginAt: userClearance >= 4 ? user.lastLoginAt : null,
    }));

    return NextResponse.json(usersList);
  } catch (error) {
    console.error("Users list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
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

    if (session.user.clearanceLevel < 5) {
      return NextResponse.json(
        { error: "Insufficient clearance. Level 5 required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      username,
      password,
      displayName,
      email,
      title,
      clearanceLevel = 1,
      departmentId,
      rankId,
    } = body;

    if (!username || !password || !displayName) {
      return NextResponse.json(
        { error: "Username, password, and displayName are required" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be lowercase letters, numbers, and underscores only" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (clearanceLevel >= session.user.clearanceLevel) {
      return NextResponse.json(
        { error: "Cannot create user with equal or higher clearance than yourself" },
        { status: 403 }
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        username: username.toLowerCase(),
        email: email || `${username.toLowerCase()}@ouroboros.foundation`,
        displayName,
        passwordHash,
        title: title || null,
        clearanceLevel,
        primaryDepartmentId: departmentId || null,
        isActive: true,
        isVerified: true,
      })
      .returning({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        clearanceLevel: users.clearanceLevel,
      });

    if (departmentId && rankId) {
      try {
        await db.insert(departmentMembers).values({
          userId: newUser.id,
          departmentId,
          rankId,
        });
      } catch (membershipError) {
        console.warn("Failed to create department membership:", membershipError);
      }
    }

    console.log(`[Users API] User created by ${session.user.username}: ${newUser.username} (L${newUser.clearanceLevel})`);

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { error: "Failed to create user", details: String(error) },
      { status: 500 }
    );
  }
}
