import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { serpentiusSeats, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const runtime = "nodejs";

// GET - Fetch all Serpentius seats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all active seats with user info if assigned
    const seats = await db
      .select({
        id: serpentiusSeats.id,
        seatId: serpentiusSeats.seatId,
        position: serpentiusSeats.position,
        serpentTitle: serpentiusSeats.serpentTitle,
        clearance: serpentiusSeats.clearance,
        symbol: serpentiusSeats.symbol,
        duties: serpentiusSeats.duties,
        obligations: serpentiusSeats.obligations,
        userId: serpentiusSeats.userId,
        memberName: serpentiusSeats.memberName,
        memberDiscord: serpentiusSeats.memberDiscord,
        memberImage: serpentiusSeats.memberImage,
        appointedAt: serpentiusSeats.appointedAt,
        sortOrder: serpentiusSeats.sortOrder,
      })
      .from(serpentiusSeats)
      .where(eq(serpentiusSeats.isActive, true))
      .orderBy(asc(serpentiusSeats.sortOrder));

    return NextResponse.json({
      seats,
      canEdit: (session.user.clearanceLevel ?? 0) >= 5,
    });
  } catch (error) {
    console.error("Serpentius seats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve the council roster" },
      { status: 500 }
    );
  }
}

// PATCH - Update a seat's member assignment (CL5+ only)
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check clearance level
    if ((session.user.clearanceLevel ?? 0) < 5) {
      return NextResponse.json(
        { error: "Insufficient clearance to modify council assignments" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { seatId, memberName, memberDiscord, memberImage, userId } = body;

    if (!seatId) {
      return NextResponse.json(
        { error: "Seat identifier required" },
        { status: 400 }
      );
    }

    // Verify seat exists
    const [existingSeat] = await db
      .select()
      .from(serpentiusSeats)
      .where(eq(serpentiusSeats.seatId, seatId));

    if (!existingSeat) {
      return NextResponse.json(
        { error: "Seat not found in the council" },
        { status: 404 }
      );
    }

    // If userId provided, verify user exists
    if (userId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return NextResponse.json(
          { error: "Designated user not found" },
          { status: 404 }
        );
      }
    }

    // Update the seat
    const [updatedSeat] = await db
      .update(serpentiusSeats)
      .set({
        userId: userId || null,
        memberName: memberName || null,
        memberDiscord: memberDiscord || null,
        memberImage: memberImage || null,
        appointedAt: memberName ? new Date() : null,
        appointedBy: memberName ? session.user.id : null,
        updatedAt: new Date(),
      })
      .where(eq(serpentiusSeats.seatId, seatId))
      .returning();

    return NextResponse.json({
      success: true,
      seat: updatedSeat,
    });
  } catch (error) {
    console.error("Serpentius seat update error:", error);
    return NextResponse.json(
      { error: "Failed to update council assignment" },
      { status: 500 }
    );
  }
}
