import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
import { db } from "@/lib/db";
import { letters, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lettersList = await db
      .select({
        id: letters.id,
        publicToken: letters.publicToken,
        title: letters.title,
        style: letters.style,
        sealType: letters.sealType,
        recipientName: letters.recipientName,
        viewCount: letters.viewCount,
        isPublic: letters.isPublic,
        isSealed: letters.isSealed,
        createdAt: letters.createdAt,
      })
      .from(letters)
      .where(eq(letters.authorId, session.user.id))
      .orderBy(desc(letters.createdAt));

    return NextResponse.json(lettersList);
  } catch (error) {
    console.error("Letters list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch letters" },
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

    const body = await request.json();
    const {
      title,
      content,
      style = "standard",
      sealType = "ouroboros",
      signature,
      recipientName,
      isPublic = true,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const publicToken = randomBytes(16).toString("hex");

    const [newLetter] = await db
      .insert(letters)
      .values({
        publicToken,
        title,
        content,
        style,
        sealType,
        signature: signature || session.user.name || session.user.username,
        authorId: session.user.id,
        recipientName,
        isPublic,
      })
      .returning();

    return NextResponse.json(newLetter, { status: 201 });
  } catch (error) {
    console.error("Letter creation error:", error);
    return NextResponse.json(
      { error: "Failed to create letter" },
      { status: 500 }
    );
  }
}
