import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { ranks, departments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("department");

    const ranksData = await db
      .select({
        id: ranks.id,
        name: ranks.name,
        shortName: ranks.shortName,
        clearanceLevel: ranks.clearanceLevel,
        sortOrder: ranks.sortOrder,
        description: ranks.description,
        departmentId: ranks.departmentId,
        departmentName: departments.name,
        departmentIcon: departments.iconSymbol,
        departmentColor: departments.color,
      })
      .from(ranks)
      .leftJoin(departments, eq(ranks.departmentId, departments.id))
      .where(
        and(
          eq(ranks.isActive, true),
          departmentId ? eq(ranks.departmentId, departmentId) : undefined
        )
      )
      .orderBy(departments.name, ranks.sortOrder);

    return NextResponse.json(ranksData);
  } catch (error) {
    console.error("Ranks list error (returning empty array):", error);
    return NextResponse.json([]);
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
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { departmentId, name, shortName, clearanceLevel, sortOrder, description } = body;

    if (!departmentId || !name) {
      return NextResponse.json(
        { error: "Department ID and rank name are required" },
        { status: 400 }
      );
    }

    const existing = await db.query.ranks.findFirst({
      where: (ranks, { and, eq }) =>
        and(eq(ranks.departmentId, departmentId), eq(ranks.name, name)),
    });

    if (existing) {
      return NextResponse.json(
        { error: "A rank with this name already exists in this department" },
        { status: 409 }
      );
    }

    const [newRank] = await db
      .insert(ranks)
      .values({
        departmentId,
        name,
        shortName: shortName || name.substring(0, 2).toUpperCase(),
        clearanceLevel: clearanceLevel ?? 1,
        sortOrder: sortOrder ?? 0,
        description,
        isActive: true,
      })
      .returning();

    return NextResponse.json(newRank, { status: 201 });
  } catch (error) {
    console.error("Rank creation error:", error);
    return NextResponse.json(
      { error: "Failed to create rank" },
      { status: 500 }
    );
  }
}
