import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { departments, ranks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { DEFAULT_DEPARTMENTS } from "@/lib/constants/departments";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeRanks = searchParams.get("includeRanks") !== "false";

    let departmentsList = await db
      .select()
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(departments.name);

    const expectedNames = DEFAULT_DEPARTMENTS.map(d => d.name) as string[];
    const actualNames = departmentsList.map(d => d.name);
    const needsDeptSync = expectedNames.some(name => !actualNames.includes(name));

    let needsRankSync = false;
    if (departmentsList.length > 0 && !needsDeptSync) {
      try {
        const totalRanks = await db.select().from(ranks);
        needsRankSync = totalRanks.length === 0;
      } catch {
          needsRankSync = false;
      }
    }

    if (departmentsList.length === 0 || needsDeptSync || needsRankSync) {
      console.log("Departments sync triggered:", {
        deptCount: departmentsList.length,
        needsDeptSync,
        needsRankSync
      });
      const allDepts = await db.select().from(departments);
      for (const dept of allDepts) {
        if (!expectedNames.includes(dept.name)) {
          await db.delete(departments).where(eq(departments.id, dept.id));
        }
      }

      for (const dept of DEFAULT_DEPARTMENTS) {
        const existing = allDepts.find(d => d.name === dept.name);
        let deptId: string;

        if (existing) {
          await db
            .update(departments)
            .set({
              codename: dept.codename,
              description: dept.description,
              iconSymbol: dept.iconSymbol,
              color: dept.color,
              isActive: true,
            })
            .where(eq(departments.id, existing.id));
          deptId = existing.id;
        } else {
          const [newDept] = await db.insert(departments).values({
            name: dept.name,
            codename: dept.codename,
            description: dept.description,
            iconSymbol: dept.iconSymbol,
            color: dept.color,
            isActive: true,
          }).returning();
          deptId = newDept.id;
        }

        if (dept.ranks) {
          for (const rank of dept.ranks) {
            try {
              const existingRank = await db.query.ranks.findFirst({
                where: (r, { and, eq: eqOp }) =>
                  and(eqOp(r.departmentId, deptId), eqOp(r.name, rank.name)),
              });

              if (!existingRank) {
                await db.insert(ranks).values({
                  departmentId: deptId,
                  name: rank.name,
                  shortName: rank.shortName,
                  clearanceLevel: rank.clearanceLevel,
                  sortOrder: rank.sortOrder,
                  description: rank.description,
                  isActive: true,
                });
                console.log(`Seeded rank: ${rank.name} for ${dept.name}`);
              }
            } catch (rankError) {
              console.error(`Failed to seed rank ${rank.name} for ${dept.name}:`, rankError);
            }
          }
        }
      }

      departmentsList = await db
        .select()
        .from(departments)
        .where(eq(departments.isActive, true))
        .orderBy(departments.name);
    }

    if (!includeRanks) {
      return NextResponse.json(departmentsList);
    }

    try {
      const departmentsWithRanks = await Promise.all(
        departmentsList.map(async (dept) => {
          const deptRanks = await db
            .select({
              id: ranks.id,
              name: ranks.name,
              shortName: ranks.shortName,
              clearanceLevel: ranks.clearanceLevel,
              sortOrder: ranks.sortOrder,
              description: ranks.description,
            })
            .from(ranks)
            .where(eq(ranks.departmentId, dept.id))
            .orderBy(desc(ranks.sortOrder));

          return {
            ...dept,
            ranks: deptRanks,
          };
        })
      );

      return NextResponse.json(departmentsWithRanks);
    } catch (ranksError) {
      console.warn("Failed to fetch ranks, returning departments only:", ranksError);
      return NextResponse.json(departmentsList.map(dept => ({ ...dept, ranks: [] })));
    }
  } catch (error) {
    console.error("Departments list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments", details: String(error) },
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
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, codename, description, iconSymbol, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const [newDept] = await db
      .insert(departments)
      .values({
        name,
        codename,
        description,
        iconSymbol: iconSymbol || "⛧",
        color: color || "#c9a227",
      })
      .returning();

    return NextResponse.json(newDept, { status: 201 });
  } catch (error) {
    console.error("Department creation error:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
