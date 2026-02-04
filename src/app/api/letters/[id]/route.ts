import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { letters, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

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

    const [letter] = await db
      .select({
        id: letters.id,
        publicToken: letters.publicToken,
        title: letters.title,
        content: letters.content,
        style: letters.style,
        sealType: letters.sealType,
        signature: letters.signature,
        recipientName: letters.recipientName,
        viewCount: letters.viewCount,
        isPublic: letters.isPublic,
        isSealed: letters.isSealed,
        createdAt: letters.createdAt,
        authorId: letters.authorId,
        authorName: users.displayName,
        authorTitle: users.title,
        authorDesignation: users.designation,
      })
      .from(letters)
      .innerJoin(users, eq(letters.authorId, users.id))
      .where(eq(letters.id, id));

    if (!letter) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 });
    }

    if (
      letter.authorId !== session.user.id &&
      session.user.clearanceLevel < 5
    ) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    return NextResponse.json(letter);
  } catch (error) {
    console.error("Letter fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch letter" },
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

    const [letter] = await db
      .select()
      .from(letters)
      .where(eq(letters.id, id));

    if (!letter) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 });
    }

    if (letter.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (letter.isSealed) {
      return NextResponse.json(
        { error: "Sealed letters cannot be edited" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      style,
      sealType,
      signature,
      recipientName,
      isPublic,
      isSealed,
    } = body;

    const [updated] = await db
      .update(letters)
      .set({
        title: title ?? letter.title,
        content: content ?? letter.content,
        style: style ?? letter.style,
        sealType: sealType ?? letter.sealType,
        signature: signature ?? letter.signature,
        recipientName: recipientName ?? letter.recipientName,
        isPublic: isPublic ?? letter.isPublic,
        isSealed: isSealed ?? letter.isSealed,
      })
      .where(eq(letters.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Letter update error:", error);
    return NextResponse.json(
      { error: "Failed to update letter" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [letter] = await db
      .select()
      .from(letters)
      .where(eq(letters.id, id));

    if (!letter) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 });
    }

    if (
      letter.authorId !== session.user.id &&
      session.user.clearanceLevel < 5
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await db.delete(letters).where(eq(letters.id, id));

    return NextResponse.json({ message: "Letter deleted" });
  } catch (error) {
    console.error("Letter deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete letter" },
      { status: 500 }
    );
  }
}
