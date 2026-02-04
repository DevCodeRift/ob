import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, departments, ranks } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { sql, eq, and } from "drizzle-orm";

const DIVISIONS = [
  {
    name: "Mechanicus",
    codename: "TECH",
    description: "The keepers of forbidden technology and arcane machinery.",
    iconSymbol: "⚙",
    color: "#b87333",
    ranks: [
      { name: "Magos", shortName: "M", clearanceLevel: 4, sortOrder: 4, description: "Master of the Machine Cult" },
      { name: "Senior Adept", shortName: "SA", clearanceLevel: 3, sortOrder: 3, description: "Experienced tech-priest" },
      { name: "Adept", shortName: "A", clearanceLevel: 2, sortOrder: 2, description: "Initiated tech-priest" },
      { name: "Acolyte", shortName: "Ac", clearanceLevel: 1, sortOrder: 1, description: "Novice of the Machine God" },
    ],
  },
  {
    name: "Occult",
    codename: "ARCANA",
    description: "Practitioners of the esoteric arts.",
    iconSymbol: "⛧",
    color: "#6b3fa0",
    ranks: [
      { name: "Archon", shortName: "Ar", clearanceLevel: 4, sortOrder: 4, description: "Master of the Arcane" },
      { name: "Senior Magister", shortName: "SM", clearanceLevel: 3, sortOrder: 3, description: "Experienced occultist" },
      { name: "Magister", shortName: "Mg", clearanceLevel: 2, sortOrder: 2, description: "Practicing occultist" },
      { name: "Aspirant", shortName: "As", clearanceLevel: 1, sortOrder: 1, description: "Student of the mysteries" },
    ],
  },
  {
    name: "Ministry of Science",
    codename: "SCIENTIA",
    description: "The empirical arm of the Foundation.",
    iconSymbol: "◎",
    color: "#2a8a8a",
    ranks: [
      { name: "Lead Researcher", shortName: "LR", clearanceLevel: 2, sortOrder: 4, description: "Department research lead" },
      { name: "Senior Researcher", shortName: "SR", clearanceLevel: 1, sortOrder: 3, description: "Experienced researcher" },
      { name: "Researcher", shortName: "R", clearanceLevel: 1, sortOrder: 2, description: "Full researcher" },
      { name: "Junior Researcher", shortName: "JR", clearanceLevel: 0, sortOrder: 1, description: "Trainee researcher" },
    ],
  },
  {
    name: "Red Hand",
    codename: "RUBRUM",
    description: "The Foundation's enforcement and security division.",
    iconSymbol: "✋",
    color: "#8b1a1a",
    ranks: [
      { name: "Commander of the Red Hand", shortName: "CMD", clearanceLevel: 5, sortOrder: 3, description: "Supreme commander of security operations" },
      { name: "Deputy Commander of the Red Hand", shortName: "DCMD", clearanceLevel: 4, sortOrder: 2, description: "Second in command of security operations" },
      { name: "Red Hand", shortName: "RH", clearanceLevel: 3, sortOrder: 1, description: "Enforcement operative" },
    ],
  },
  {
    name: "Leadership",
    codename: "COMMAND",
    description: "The governing body of the Foundation.",
    iconSymbol: "◆",
    color: "#c9a227",
    ranks: [
      { name: "Founder", shortName: "F", clearanceLevel: 5, sortOrder: 6, description: "Founding member of the Foundation" },
      { name: "Director", shortName: "D", clearanceLevel: 5, sortOrder: 5, description: "Executive director of the Foundation" },
      { name: "Deputy Director", shortName: "DD", clearanceLevel: 4, sortOrder: 4, description: "Second in command of the Foundation" },
      { name: "Senior Administrator", shortName: "SA", clearanceLevel: 4, sortOrder: 3, description: "Senior administrative officer" },
      { name: "Administrator", shortName: "A", clearanceLevel: 3, sortOrder: 2, description: "Administrative officer" },
      { name: "Coordinator", shortName: "C", clearanceLevel: 2, sortOrder: 1, description: "Operations coordinator" },
    ],
  },
];

async function seedDivisionsAndRanks() {
  const results = { divisions: 0, ranks: 0 };

  for (const division of DIVISIONS) {
    const [existingDept] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.name, division.name))
      .limit(1);

    let departmentId: string;

    if (existingDept) {
      departmentId = existingDept.id;
    } else {
      const [newDept] = await db
        .insert(departments)
        .values({
          name: division.name,
          codename: division.codename,
          description: division.description,
          iconSymbol: division.iconSymbol,
          color: division.color,
          isActive: true,
        })
        .returning({ id: departments.id });

      departmentId = newDept.id;
      results.divisions++;
    }

    for (const rank of division.ranks) {
      const [existingRank] = await db
        .select({ id: ranks.id })
        .from(ranks)
        .where(and(eq(ranks.departmentId, departmentId), eq(ranks.name, rank.name)))
        .limit(1);

      if (!existingRank) {
        await db.insert(ranks).values({
          departmentId,
          name: rank.name,
          shortName: rank.shortName,
          clearanceLevel: rank.clearanceLevel,
          sortOrder: rank.sortOrder,
          description: rank.description,
          isActive: true,
        });
        results.ranks++;
      }
    }
  }

  return results;
}

const CREATE_TABLES_SQL = `
-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE security_class AS ENUM ('GREEN', 'AMBER', 'RED', 'BLACK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE threat_level AS ENUM ('negligible', 'low', 'moderate', 'high', 'critical', 'apollyon');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('active', 'review', 'suspended', 'archived', 'expunged');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE project_role AS ENUM ('lead', 'researcher', 'assistant', 'observer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE entry_type AS ENUM ('observation', 'experiment', 'incident', 'note', 'addendum', 'interview');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE report_type AS ENUM ('general', 'incident', 'intel', 'status', 'containment_breach');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE priority AS ENUM ('low', 'normal', 'high', 'critical', 'omega');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'acknowledged', 'investigating', 'resolved', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending', 'contacted', 'interviewing', 'approved', 'rejected', 'blacklisted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE letter_style AS ENUM ('standard', 'decree', 'summons', 'prophecy', 'warning', 'commendation');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE seal_type AS ENUM ('ouroboros', 'eye', 'serpent', 'moon', 'void', 'mechanicus');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE project_access_type AS ENUM ('user', 'department', 'rank', 'clearance');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  codename TEXT,
  description TEXT,
  head_user_id UUID,
  icon_symbol TEXT DEFAULT '⛧',
  color TEXT DEFAULT '#c9a227',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Ranks table
CREATE TABLE IF NOT EXISTS ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  clearance_level INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(department_id, name)
);

CREATE INDEX IF NOT EXISTS idx_ranks_dept ON ranks(department_id);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  title TEXT,
  designation TEXT,
  clearance_level INTEGER NOT NULL DEFAULT 0,
  primary_department_id UUID REFERENCES departments(id),
  profile_image TEXT,
  bio TEXT,
  specializations TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_clearance ON users(clearance_level);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(primary_department_id);

-- Sessions table (for NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  title TEXT,
  clearance_level INTEGER NOT NULL DEFAULT 1,
  department_id UUID REFERENCES departments(id),
  rank_id UUID REFERENCES ranks(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_invites_token ON invitations(token);

-- Add department_id column to invitations if it doesn't exist
DO $$ BEGIN
  ALTER TABLE invitations ADD COLUMN department_id UUID REFERENCES departments(id);
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add rank_id column to invitations if it doesn't exist
DO $$ BEGIN
  ALTER TABLE invitations ADD COLUMN rank_id UUID REFERENCES ranks(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_handle TEXT NOT NULL,
  email TEXT,
  proposed_name TEXT NOT NULL,
  proposed_title TEXT,
  requested_department_id UUID REFERENCES departments(id),
  requested_rank_id UUID REFERENCES ranks(id),
  preferred_department TEXT,
  username TEXT,
  password_hash TEXT,
  motivation TEXT,
  experience TEXT,
  referral TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_apps_date ON applications(created_at);

-- Add new columns to applications if they don't exist
DO $$ BEGIN
  ALTER TABLE applications ADD COLUMN requested_department_id UUID REFERENCES departments(id);
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE applications ADD COLUMN requested_rank_id UUID REFERENCES ranks(id);
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE applications ADD COLUMN username TEXT;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE applications ADD COLUMN password_hash TEXT;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE applications ADD COLUMN created_user_id UUID REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Create username index after column exists
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_apps_username ON applications(username);
EXCEPTION WHEN undefined_column THEN null; END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- THE COVENANT OF SCALES
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE covenant_role AS ENUM ('sovereign', 'keeper', 'initiate', 'aspirant');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Covenant Members
CREATE TABLE IF NOT EXISTS covenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  covenant_title TEXT NOT NULL,
  covenant_role covenant_role NOT NULL DEFAULT 'aspirant',
  oath_taken_at TIMESTAMP NOT NULL,
  inducted_by UUID REFERENCES users(id),
  sigil TEXT,
  motto TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_covenant_user ON covenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_covenant_role ON covenant_members(covenant_role);

-- Covenant Invitations
CREATE TABLE IF NOT EXISTS covenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  target_user_id UUID REFERENCES users(id),
  target_name TEXT NOT NULL,
  proposed_title TEXT NOT NULL,
  proposed_role covenant_role NOT NULL DEFAULT 'aspirant',
  proposed_sigil TEXT,
  invocation_text TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  username TEXT,
  password_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_covenant_invite_token ON covenant_invitations(token);
`;

export async function POST(request: Request) {
  try {
    console.log("[Setup] Creating database tables...");
    await db.execute(sql.raw(CREATE_TABLES_SQL));
    console.log("[Setup] Tables created/verified");

    const existingUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const userCount = Number(existingUsers[0]?.count || 0);

    let body: { username?: string; password?: string; email?: string; resetPassword?: boolean } = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
    }
    const { username, password, email, resetPassword } = body;

    if (userCount > 0) {
      if (resetPassword && username && password) {
        console.log("[Setup] Resetting password for:", username);
        const passwordHash = await bcrypt.hash(password, 12);

        const result = await db
          .update(users)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(users.username, username.toLowerCase()))
          .returning({ id: users.id, username: users.username });

        if (result.length === 0) {
          return NextResponse.json(
            { error: "User not found", success: false },
            { status: 404 }
          );
        }

        const seedResults = await seedDivisionsAndRanks();

        return NextResponse.json({
          success: true,
          message: `Password reset for user: ${username}`,
          tablesCreated: true,
          passwordReset: true,
          seeded: seedResults,
        });
      }

      console.log("[Setup] Admin exists, checking divisions...");
      const seedResults = await seedDivisionsAndRanks();

      return NextResponse.json({
        success: true,
        message: "Setup complete. Admin user already exists. Use resetPassword:true to reset password.",
        tablesCreated: true,
        userExists: true,
        seeded: seedResults,
      });
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required", tablesCreated: true },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db.insert(users).values({
      email: email || `${username}@ouroboros.foundation`,
      username: username.toLowerCase(),
      displayName: "System Administrator",
      passwordHash,
      clearanceLevel: 5,
      title: "Archmagos Primus",
      designation: "ADMIN-001",
      isActive: true,
      isVerified: true,
    }).returning({ id: users.id, username: users.username });

    console.log("[Setup] Seeding divisions and ranks...");
    const seedResults = await seedDivisionsAndRanks();
    console.log(`[Setup] Created ${seedResults.divisions} divisions and ${seedResults.ranks} ranks`);

    return NextResponse.json({
      success: true,
      message: "Setup complete. Admin user created.",
      tablesCreated: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        clearanceLevel: 5,
      },
      seeded: seedResults,
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Setup failed. Check server logs.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const existingUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const userCount = Number(existingUsers[0]?.count || 0);

    return NextResponse.json({
      setupRequired: userCount === 0,
      tablesExist: true,
      message: userCount === 0
        ? "Tables exist but no users. POST to create admin."
        : "Setup complete. System has users.",
    });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "42P01") {
      return NextResponse.json({
        setupRequired: true,
        tablesExist: false,
        message: "Tables don't exist. POST to this endpoint to create them and set up admin.",
      });
    }

    console.error("Setup check error:", error);
    return NextResponse.json(
      { error: "Database connection failed", setupRequired: true, details: String(error) },
      { status: 500 }
    );
  }
}
