import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log("Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed successfully");
  } catch (error: any) {
    if (error?.cause?.code === "42710" || error?.cause?.code === "42P07") {
      console.log("Some objects already exist, marking migrations as applied...");

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at bigint
        )
      `);

      const fs = await import("fs");
      const path = await import("path");
      const metaPath = path.join(process.cwd(), "drizzle", "meta", "_journal.json");

      if (fs.existsSync(metaPath)) {
        const journal = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        for (const entry of journal.entries) {
          await pool.query(
            `INSERT INTO "__drizzle_migrations" (hash, created_at)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [entry.tag, Date.now()]
          );
        }
        console.log("Migration records updated");
      }
    } else {
      throw error;
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
