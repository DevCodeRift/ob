import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { reports, users, projects, reportReads } from "@/lib/db/schema";
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

    const { id } = await params;

    const [report] = await db
      .select({
        id: reports.id,
        reportCode: reports.reportCode,
        title: reports.title,
        content: reports.content,
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
        authorDesignation: users.designation,
        projectId: projects.id,
        projectCode: projects.projectCode,
        projectName: projects.name,
      })
      .from(reports)
      .innerJoin(users, eq(reports.authorId, users.id))
      .leftJoin(projects, eq(reports.projectId, projects.id))
      .where(eq(reports.id, id));

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (session.user.clearanceLevel < (report.minClearanceToView ?? 1)) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }


    if (session.user.clearanceLevel >= 4) {
      await db
        .insert(reportReads)
        .values({
          reportId: id,
          userId: session.user.id,
        })
        .onConflictDoNothing();
    }

    let acknowledgedByUser = null;
    if (report.acknowledgedAt) {
      const [ackResult] = await db
        .select({
          acknowledgedById: reports.acknowledgedBy,
        })
        .from(reports)
        .where(eq(reports.id, id));

      if (ackResult?.acknowledgedById) {
        const [ackUser] = await db
          .select({
            name: users.displayName,
            title: users.title,
          })
          .from(users)
          .where(eq(users.id, ackResult.acknowledgedById));
        acknowledgedByUser = ackUser;
      }
    }

    return NextResponse.json({
      ...report,
      acknowledgedByUser,
    });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
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

    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id));

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (session.user.clearanceLevel < (report.minClearanceToView ?? 1)) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, priority } = body;

    if (status && session.user.clearanceLevel < 3) {
      return NextResponse.json(
        { error: "Insufficient clearance to change status" },
        { status: 403 }
      );
    }

    const updateData: Record<string, any> = {};

    if (status) {
      updateData.status = status;
      if (status === "acknowledged" && !report.acknowledgedAt) {
        updateData.acknowledgedAt = new Date();
        updateData.acknowledgedBy = session.user.id;
      }
      if (status === "resolved" && !report.resolvedAt) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = session.user.id;
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    const [updated] = await db
      .update(reports)
      .set(updateData)
      .where(eq(reports.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Report update error:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
