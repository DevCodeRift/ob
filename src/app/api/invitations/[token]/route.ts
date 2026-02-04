import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invitations, users, departments } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const [invitation] = await db
      .select({
        id: invitations.id,
        displayName: invitations.displayName,
        title: invitations.title,
        clearanceLevel: invitations.clearanceLevel,
        expiresAt: invitations.expiresAt,
        usedAt: invitations.usedAt,
        departmentName: departments.name,
      })
      .from(invitations)
      .leftJoin(departments, eq(invitations.departmentId, departments.id))
      .where(eq(invitations.token, token));

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation" },
        { status: 404 }
      );
    }

    if (invitation.usedAt) {
      return NextResponse.json(
        { error: "Invitation already used" },
        { status: 400 }
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Invitation expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      displayName: invitation.displayName,
      title: invitation.title,
      clearanceLevel: invitation.clearanceLevel,
      departmentName: invitation.departmentName,
    });
  } catch (error) {
    console.error("Invitation validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate invitation" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { username, password, email } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.token, token),
          isNull(invitations.usedAt),
          gt(invitations.expiresAt, new Date())
        )
      );

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 400 }
      );
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()));

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        username: username.toLowerCase(),
        email: email || `${username.toLowerCase()}@ouroboros.foundation`,
        passwordHash,
        displayName: invitation.displayName,
        title: invitation.title,
        clearanceLevel: invitation.clearanceLevel,
        primaryDepartmentId: invitation.departmentId,
        isActive: true,
        isVerified: true,
      })
      .returning({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        clearanceLevel: users.clearanceLevel,
      });

    await db
      .update(invitations)
      .set({
        usedAt: new Date(),
        usedBy: newUser.id,
      })
      .where(eq(invitations.id, invitation.id));

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Invitation redemption error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
