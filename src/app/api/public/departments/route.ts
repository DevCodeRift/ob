import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { departments, ranks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const departmentsList = await db
      .select({
        id: departments.id,
        name: departments.name,
        codename: departments.codename,
        description: departments.description,
        iconSymbol: departments.iconSymbol,
        color: departments.color,
      })
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(asc(departments.name));

    const ranksList = await db
      .select({
        id: ranks.id,
        departmentId: ranks.departmentId,
        name: ranks.name,
        shortName: ranks.shortName,
        clearanceLevel: ranks.clearanceLevel,
        sortOrder: ranks.sortOrder,
        description: ranks.description,
      })
      .from(ranks)
      .where(eq(ranks.isActive, true))
      .orderBy(asc(ranks.sortOrder));

    const departmentsWithRanks = departmentsList.map((dept) => ({
      ...dept,
      ranks: ranksList.filter((r) => r.departmentId === dept.id),
    }));

    return NextResponse.json(departmentsWithRanks);
  } catch (error) {
    console.error("Public departments fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}
