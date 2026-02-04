import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { letters, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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
        createdAt: letters.createdAt,
        authorName: users.displayName,
        authorTitle: users.title,
      })
      .from(letters)
      .innerJoin(users, eq(letters.authorId, users.id))
      .where(eq(letters.publicToken, token));

    if (!letter) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 });
    }

    if (!letter.isPublic) {
      return NextResponse.json(
        { error: "This letter is not public" },
        { status: 403 }
      );
    }

    await db
      .update(letters)
      .set({ viewCount: sql`${letters.viewCount} + 1` })
      .where(eq(letters.publicToken, token));

    return NextResponse.json({
      ...letter,
      viewCount: letter.viewCount + 1,
    });
  } catch (error) {
    console.error("Public letter fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch letter" },
      { status: 500 }
    );
  }
}
