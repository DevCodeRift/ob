import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { logbookEntries, projects, projectAssignments, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const SECURITY_CLEARANCE_MAP: Record<string, number> = {
  GREEN: 1,
  AMBER: 2,
  RED: 4,
  BLACK: 5,
};

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

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const requiredClearance = SECURITY_CLEARANCE_MAP[project.securityClass] || 1;
    if (userClearance < requiredClearance) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    const entries = await db
      .select({
        id: logbookEntries.id,
        entryNumber: logbookEntries.entryNumber,
        entryText: logbookEntries.entryText,
        entryType: logbookEntries.entryType,
        attachments: logbookEntries.attachments,
        minClearanceToView: logbookEntries.minClearanceToView,
        redactedVersion: logbookEntries.redactedVersion,
        isRedacted: logbookEntries.isRedacted,
        createdAt: logbookEntries.createdAt,
        authorId: users.id,
        authorName: users.displayName,
        authorTitle: users.title,
        authorDesignation: users.designation,
      })
      .from(logbookEntries)
      .innerJoin(users, eq(logbookEntries.authorId, users.id))
      .where(eq(logbookEntries.projectId, id))
      .orderBy(desc(logbookEntries.createdAt));

    const processedEntries = entries.map((entry) => {
      if (entry.isRedacted && userClearance < (entry.minClearanceToView || 0)) {
        return {
          ...entry,
          entryText: entry.redactedVersion || "[REDACTED - INSUFFICIENT CLEARANCE]",
          attachments: null,
        };
      }
      return entry;
    });

    return NextResponse.json(processedEntries);
  } catch (error) {
    console.error("Logbook fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logbook" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const requiredClearance = SECURITY_CLEARANCE_MAP[project.securityClass] || 1;
    if (session.user.clearanceLevel < requiredClearance) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    if (session.user.clearanceLevel < 4) {
      const [assignment] = await db
        .select()
        .from(projectAssignments)
        .where(
          and(
            eq(projectAssignments.projectId, id),
            eq(projectAssignments.userId, session.user.id)
          )
        );

      if (!assignment) {
        return NextResponse.json(
          { error: "You must be assigned to this project" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      entryText,
      entryType = "observation",
      attachments,
      minClearanceToView,
      redactedVersion,
      isRedacted = false,
    } = body;

    if (!entryText) {
      return NextResponse.json(
        { error: "Entry text is required" },
        { status: 400 }
      );
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(logbookEntries)
      .where(eq(logbookEntries.projectId, id));
    const entryNumber = Number(countResult?.count || 0) + 1;

    const [newEntry] = await db
      .insert(logbookEntries)
      .values({
        projectId: id,
        authorId: session.user.id,
        entryNumber,
        entryText,
        entryType,
        attachments,
        minClearanceToView: isRedacted ? minClearanceToView : null,
        redactedVersion: isRedacted ? redactedVersion : null,
        isRedacted,
      })
      .returning();

    await db
      .update(projects)
      .set({ updatedAt: new Date() })
      .where(eq(projects.id, id));

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Logbook entry creation error:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    );
  }
}
