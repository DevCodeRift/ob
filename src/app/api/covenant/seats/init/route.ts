import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

// Seat definitions - single source of truth
// Clearance structure:
// - ouroboros_sovereign: CL5 - The Keeper alone, chairs the council
// - ophidian_apex: CL2 - Inner circle with full operational knowledge
// - venom_circle: CL1 - Operational members with significant access
// - scale_bearer: CL0 - Aware of existence, need-to-know basis only
// - outer_coil: Outside the Order but aware of its existence
const SEAT_DEFINITIONS = [
  // OUROBOROS SOVEREIGN (CL5)
  { seatId: 'science_minister', position: 'Science Minister', serpentTitle: 'Jormungandr', clearance: 'ouroboros_sovereign', symbol: '◎', duties: 'Chairs the Serpentius council. Oversees all scientific research, technological development, and the classified programs of the Ouroboros Foundation. Holds supreme authority within the Order.', obligations: "Must safeguard the Foundation's most dangerous secrets. Ensures scientific progress serves the Order's long-term objectives. Bears final responsibility for all Serpentius operations.", sortOrder: 1 },
  // OPHIDIAN APEX (CL2)
  { seatId: 'prime_minister', position: 'Prime Minister', serpentTitle: 'The Hognose', clearance: 'ophidian_apex', symbol: '👁', duties: 'Supreme coordination of all state affairs. Responsible for maintaining the balance between overt governance and covert operations.', obligations: "Must ensure the Order's influence permeates all branches of government without detection. Bears ultimate responsibility for operational security.", sortOrder: 2 },
  { seatId: 'nsb_director', position: 'Director of the National Security Bureau', serpentTitle: 'The Cobra', clearance: 'ophidian_apex', symbol: '🛡', duties: 'Commands all political police operations. Oversees the Secret Police and Intelligence Services. Monitors ideological loyalty and investigates political crimes.', obligations: 'Directs The Black Mamba and The Serpent\'s Eye. Must share all surveillance data with the Keeper. Identifies potential Serpentius recruits and threats.', sortOrder: 3 },
  { seatId: 'konsul', position: 'Konsul of the White Rose Party', serpentTitle: 'The Hydra', clearance: 'ophidian_apex', symbol: '⚜', duties: 'Controls the single party apparatus and all political machinery. Manages public ideology and party membership.', obligations: 'Must ensure the Party serves as a perfect shield for Serpentius operations. Maintains the illusion of ideological governance.', sortOrder: 4 },
  { seatId: 'praetor', position: 'Praetor', serpentTitle: 'The Anaconda', clearance: 'ophidian_apex', symbol: '⚔', duties: 'Commands the Paramilitary forces and oversees the Interior Ministry. Responsible for internal security and civil order.', obligations: 'Must be prepared to deploy force against any internal threat. Coordinates with The Black Mamba on sensitive operations.', sortOrder: 5 },
  // VENOM CIRCLE (CL1)
  { seatId: 'secret_police_director', position: 'Director of the Secret Police', serpentTitle: 'The Black Mamba', clearance: 'venom_circle', symbol: '🗡', duties: 'Commands the clandestine enforcement apparatus. Conducts internal purges and eliminates threats to state security.', obligations: 'Must execute termination orders without hesitation or record. Reports to The Cobra. Ensures no trace of Serpentius activities can be connected to the state.', sortOrder: 6 },
  { seatId: 'intelligence_director', position: 'Director of Intelligence Services', serpentTitle: "The Serpent's Eye", clearance: 'venom_circle', symbol: '◉', duties: 'Controls all foreign and domestic intelligence gathering. Manages spy networks and conducts espionage operations.', obligations: 'Must maintain absolute information superiority over all potential adversaries. Reports to The Cobra. Shares all critical intelligence with Apex members.', sortOrder: 7 },
  { seatId: 'truth_minister', position: 'Truth Minister', serpentTitle: 'The Forked Tongue', clearance: 'venom_circle', symbol: '📜', duties: 'Controls all information, propaganda, and public narrative. Manages state media and censorship apparatus.', obligations: 'Must ensure no unauthorized information reaches the public. Creates and maintains false narratives as directed.', sortOrder: 8 },
  { seatId: 'war_minister', position: 'War Minister', serpentTitle: 'The Viper', clearance: 'venom_circle', symbol: '⚔', duties: 'Commands the armed forces and oversees military strategy. Responsible for defense planning and military operations.', obligations: 'Must ensure military assets can be deployed for Serpentius objectives when required.', sortOrder: 9 },
  { seatId: 'vsk_commander', position: 'Commander of the VSK', serpentTitle: 'The Boa', clearance: 'venom_circle', symbol: '💀', duties: 'Commands the Paramilitary Army Group. Responsible for large-scale internal security operations.', obligations: "Must execute deployment orders from the Praetor without question. Serves as the Order's iron fist.", sortOrder: 10 },
  // SCALE BEARER (CL0 - aware of existence, need-to-know)
  { seatId: 'foreign_minister', position: 'Foreign Minister', serpentTitle: 'The Sidewinder', clearance: 'scale_bearer', symbol: '🌐', duties: 'Manages diplomatic relations and foreign policy. Represents the state in international affairs.', obligations: 'Aware of the Order but receives information only as needed. Must coordinate foreign messaging with The Forked Tongue. Maintains plausible deniability.', sortOrder: 11 },
  { seatId: 'finance_minister', position: 'Finance Minister', serpentTitle: 'The Python', clearance: 'scale_bearer', symbol: '💰', duties: 'Controls state finances, taxation, and economic policy. Manages the treasury.', obligations: "Aware of the Order but receives information only as needed. Must maintain hidden funding channels when directed. Ensures financial records reveal nothing of the Order.", sortOrder: 12 },
  { seatId: 'labour_minister', position: 'Labour Minister', serpentTitle: 'The Constrictor', clearance: 'scale_bearer', symbol: '⚒', duties: 'Oversees workforce management, labour relations, and employment policy. Controls unions and worker organizations.', obligations: 'Aware of the Order but receives information only as needed. Must ensure labour unrest never threatens state stability.', sortOrder: 13 },
  { seatId: 'procurements_minister', position: 'Procurements Minister', serpentTitle: 'The Rattlesnake', clearance: 'scale_bearer', symbol: '📦', duties: 'Manages all state procurement and supply chains. Oversees contracts, acquisitions, and resource allocation.', obligations: 'Aware of the Order but receives information only as needed. Must ensure sensitive acquisitions leave no paper trail when directed.', sortOrder: 14 },
  // OUTER COIL (Outside but aware)
  { seatId: 'kaiser_guard_commander', position: 'Commander of the Kaiser Guard', serpentTitle: 'Scale of the Crown', clearance: 'outer_coil', symbol: '👑', duties: "Commands the Emperor's personal guard force. Responsible for the physical security of the Imperial person.", obligations: 'Knows of the Serpentius but is deliberately excluded from operational knowledge. Loyalty remains singular to the throne. Serves as a check on the Order.', sortOrder: 15 },
];

// POST - Initialize the serpentius_seats table (CL5+ only, one-time setup)
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user.clearanceLevel ?? 0) < 5) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    // Check if table already exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'serpentius_seats'
      );
    `);

    const tableExists = tableCheck.rows[0]?.exists === true;

    if (tableExists) {
      // Check if data exists
      const countCheck = await db.execute(sql`SELECT COUNT(*) as count FROM serpentius_seats`);
      const count = parseInt(countCheck.rows[0]?.count as string) || 0;

      if (count > 0) {
        return NextResponse.json({
          success: true,
          message: `Table already exists with ${count} seats`,
          alreadyExists: true
        });
      }
    }

    // Create enum type if not exists
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE serpentius_clearance AS ENUM('ophidian_apex', 'venom_circle', 'scale_bearer', 'outer_coil');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS serpentius_seats (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        seat_id text NOT NULL UNIQUE,
        position text NOT NULL,
        serpent_title text NOT NULL,
        clearance serpentius_clearance NOT NULL,
        symbol text DEFAULT '⛧' NOT NULL,
        duties text NOT NULL,
        obligations text NOT NULL,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        member_name text,
        member_discord text,
        member_image text,
        appointed_at timestamp,
        appointed_by uuid REFERENCES users(id),
        sort_order integer DEFAULT 0 NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_serpentius_seat ON serpentius_seats(seat_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_serpentius_user ON serpentius_seats(user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_serpentius_clearance ON serpentius_seats(clearance);`);

    // Seed the seats from definitions
    for (const seat of SEAT_DEFINITIONS) {
      await db.execute(sql`
        INSERT INTO serpentius_seats (seat_id, position, serpent_title, clearance, symbol, duties, obligations, sort_order)
        VALUES (${seat.seatId}, ${seat.position}, ${seat.serpentTitle}, ${seat.clearance}::serpentius_clearance, ${seat.symbol}, ${seat.duties}, ${seat.obligations}, ${seat.sortOrder})
        ON CONFLICT (seat_id) DO NOTHING
      `);
    }

    return NextResponse.json({
      success: true,
      message: "Serpentius seats table created and seeded with 13 positions"
    });
  } catch (error) {
    console.error("Serpentius seats init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Re-sync seat definitions (updates duties/obligations, preserves member assignments)
export async function PUT() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user.clearanceLevel ?? 0) < 5) {
      return NextResponse.json(
        { error: "Insufficient clearance" },
        { status: 403 }
      );
    }

    // Add the new ouroboros_sovereign enum value if it doesn't exist
    const enumCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'ouroboros_sovereign'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'serpentius_clearance')
      ) as exists
    `);

    if (!enumCheck.rows[0]?.exists) {
      await db.execute(sql`
        ALTER TYPE serpentius_clearance ADD VALUE 'ouroboros_sovereign' BEFORE 'ophidian_apex'
      `);
    }

    let updated = 0;
    for (const seat of SEAT_DEFINITIONS) {
      await db.execute(sql`
        UPDATE serpentius_seats
        SET
          position = ${seat.position},
          serpent_title = ${seat.serpentTitle},
          clearance = ${seat.clearance}::serpentius_clearance,
          symbol = ${seat.symbol},
          duties = ${seat.duties},
          obligations = ${seat.obligations},
          sort_order = ${seat.sortOrder},
          updated_at = now()
        WHERE seat_id = ${seat.seatId}
      `);
      updated++;
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} seat definitions (member assignments preserved)`
    });
  } catch (error) {
    console.error("Serpentius seats sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync: " + (error as Error).message },
      { status: 500 }
    );
  }
}
