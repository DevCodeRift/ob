import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const DIVISIONS = [
  {
    name: "Mechanicus",
    codename: "TECH",
    description: "The keepers of forbidden technology and arcane machinery. They maintain the Foundation's technological infrastructure and research anomalous devices.",
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
    description: "Practitioners of the esoteric arts. They study and contain supernatural phenomena, ritual magic, and entities from beyond the veil.",
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
    description: "The empirical arm of the Foundation. They apply the scientific method to understand and document anomalous phenomena.",
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
    description: "The Foundation's enforcement and security division. They handle containment breaches, security operations, and protection of personnel and assets.",
    iconSymbol: "✋",
    color: "#8b1a1a",
    ranks: [
      { name: "Commander of the Red Hand", shortName: "CMD", clearanceLevel: 5, sortOrder: 3, description: "Supreme commander of security operations" },
      { name: "Deputy Commander of the Red Hand", shortName: "DCMD", clearanceLevel: 4, sortOrder: 2, description: "Second in command of security operations" },
      { name: "Red Hand", shortName: "RH", clearanceLevel: 3, sortOrder: 1, description: "Enforcement operative" },
    ],
  },
];

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  OUROBOROS FOUNDATION - DATABASE INITIALIZATION");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  const existingAdmin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, "admin"),
  });

  if (existingAdmin) {
    console.log("⚠ Admin user already exists.");
  } else {
    const passwordHash = await bcrypt.hash("changeme123", 12);

    await db.insert(schema.users).values({
      email: "admin@ouroboros.foundation",
      username: "admin",
      displayName: "System Administrator",
      passwordHash,
      clearanceLevel: 5,
      title: "Archmagos Primus",
      designation: "ADMIN-001",
      isActive: true,
      isVerified: true,
    });

    console.log("✓ Created admin user:");
    console.log("    Username: admin");
    console.log("    Password: changeme123");
    console.log("    Clearance: Level 5 (Archmagos)");
    console.log("");
    console.log("  ⚠ IMPORTANT: Change this password immediately after first login!");
    console.log("");
  }

  console.log("───────────────────────────────────────────────────────────────");
  console.log("  SEEDING DIVISIONS AND RANKS");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("");

  for (const division of DIVISIONS) {
    const existingDept = await db.query.departments.findFirst({
      where: (departments, { eq }) => eq(departments.name, division.name),
    });

    let departmentId: string;

    if (existingDept) {
      console.log(`⚠ Division "${division.name}" already exists.`);
      departmentId = existingDept.id;
    } else {
      const [newDept] = await db
        .insert(schema.departments)
        .values({
          name: division.name,
          codename: division.codename,
          description: division.description,
          iconSymbol: division.iconSymbol,
          color: division.color,
          isActive: true,
        })
        .returning();

      departmentId = newDept.id;
      console.log(`✓ Created division: ${division.iconSymbol} ${division.name} (${division.codename})`);
    }

    for (const rank of division.ranks) {
      const existingRank = await db.query.ranks.findFirst({
        where: (ranks, { and, eq }) =>
          and(eq(ranks.departmentId, departmentId), eq(ranks.name, rank.name)),
      });

      if (existingRank) {
        console.log(`  ⚠ Rank "${rank.name}" already exists in ${division.name}`);
      } else {
        await db.insert(schema.ranks).values({
          departmentId,
          name: rank.name,
          shortName: rank.shortName,
          clearanceLevel: rank.clearanceLevel,
          sortOrder: rank.sortOrder,
          description: rank.description,
          isActive: true,
        });
        console.log(`  ✓ Created rank: ${rank.name} (L${rank.clearanceLevel})`);
      }
    }
    console.log("");
  }

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  SEED COMPLETE");
  console.log("═══════════════════════════════════════════════════════════════");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
