import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { reports, users, projects, reportReads } from "@/lib/db/schema";
import { eq, desc, and, gte, sql, isNull } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userClearance = session.user.clearanceLevel;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const type = searchParams.get("type");

    const reportsList = await db
      .select({
        id: reports.id,
        reportCode: reports.reportCode,
        title: reports.title,
        summary: reports.summary,
        reportType: reports.reportType,
        priority: reports.priority,
        status: reports.status,
        minClearanceToView: reports.minClearanceToView,
        createdAt: reports.createdAt,
        acknowledgedAt: reports.acknowledgedAt,
        resolvedAt: reports.resolvedAt,
        authorId: users.id,
        authorName: users.displayName,
        authorTitle: users.title,
        projectCode: projects.projectCode,
        projectName: projects.name,
      })
      .from(reports)
      .innerJoin(users, eq(reports.authorId, users.id))
      .leftJoin(projects, eq(reports.projectId, projects.id))
      .where(
        and(
          gte(sql`${userClearance}`, reports.minClearanceToView),
          status ? eq(reports.status, status as any) : undefined,
          priority ? eq(reports.priority, priority as any) : undefined,
          type ? eq(reports.reportType, type as any) : undefined
        )
      )
      .orderBy(desc(reports.createdAt));

    if (userClearance >= 4) {
      const readsResult = await db
        .select({ reportId: reportReads.reportId })
        .from(reportReads)
        .where(eq(reportReads.userId, session.user.id));

      const readIds = new Set(readsResult.map((r) => r.reportId));

      const enrichedReports = reportsList.map((report) => ({
        ...report,
        isRead: readIds.has(report.id),
      }));

      return NextResponse.json(enrichedReports);
    }

    return NextResponse.json(reportsList);
  } catch (error) {
    console.error("Reports list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
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

    if (session.user.clearanceLevel < 1) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      summary,
      reportType = "general",
      priority = "normal",
      projectId,
      minClearanceToView = 1,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const actualMinClearance = Math.min(
      minClearanceToView,
      session.user.clearanceLevel
    );

    const year = new Date().getFullYear();
    const typePrefixMap: Record<string, string> = {
      general: "GR",
      incident: "IR",
      intel: "IN",
      status: "SR",
      containment_breach: "CB",
    };
    const typePrefix = typePrefixMap[reportType] || "GR";

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(reports);
    const count = Number(countResult[0]?.count || 0) + 1;
    const reportCode = `${typePrefix}-${year}-${String(count).padStart(4, "0")}`;

    const [newReport] = await db
      .insert(reports)
      .values({
        reportCode,
        title,
        content,
        summary,
        reportType,
        priority,
        projectId: projectId || null,
        authorId: session.user.id,
        minClearanceToView: actualMinClearance,
      })
      .returning();

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error("Report creation error:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
