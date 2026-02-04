import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { applications, users, ranks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    let reviewer = null;
    if (application.reviewedBy) {
      const [reviewerData] = await db
        .select({
          displayName: users.displayName,
          title: users.title,
        })
        .from(users)
        .where(eq(users.id, application.reviewedBy));
      reviewer = reviewerData;
    }

    return NextResponse.json({
      ...application,
      reviewer,
    });
  } catch (error) {
    console.error("Application fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
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

    if (session.user.clearanceLevel < 4) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = {
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    let createdUser = null;
    if (status === "approved") {
      if (!application.username || !application.passwordHash) {
        return NextResponse.json(
          { error: "Application does not have credentials. Cannot approve." },
          { status: 400 }
        );
      }

      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, application.username));

      if (existingUser) {
        return NextResponse.json(
          { error: "Username has been taken since application was submitted" },
          { status: 400 }
        );
      }

      let clearanceLevel = 1;
      if (application.requestedRankId) {
        const [rank] = await db
          .select({ clearanceLevel: ranks.clearanceLevel })
          .from(ranks)
          .where(eq(ranks.id, application.requestedRankId));
        if (rank) {
          clearanceLevel = rank.clearanceLevel;
        }
      }

      const [newUser] = await db
        .insert(users)
        .values({
          username: application.username,
          email: application.email || `${application.username}@ouroboros.foundation`,
          passwordHash: application.passwordHash,
          displayName: application.proposedName,
          title: application.proposedTitle,
          clearanceLevel,
          primaryDepartmentId: application.requestedDepartmentId,
          isActive: true,
          isVerified: true,
        })
        .returning({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          clearanceLevel: users.clearanceLevel,
        });

      createdUser = newUser;
      updateData.createdUserId = newUser.id;
    }

    const [updated] = await db
      .update(applications)
      .set(updateData)
      .where(eq(applications.id, id))
      .returning();

    return NextResponse.json({
      application: updated,
      user: createdUser,
      message: createdUser
        ? `User account created for ${createdUser.username}`
        : undefined,
    });
  } catch (error) {
    console.error("Application update error:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
