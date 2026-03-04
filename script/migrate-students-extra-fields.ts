import "dotenv/config";
import pg from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const { Pool } = pg;
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      ALTER TABLE public.students
        ADD COLUMN IF NOT EXISTS nationality text,
        ADD COLUMN IF NOT EXISTS start_date text,
        ADD COLUMN IF NOT EXISTS level text,
        ADD COLUMN IF NOT EXISTS health_status text,
        ADD COLUMN IF NOT EXISTS address text,
        ADD COLUMN IF NOT EXISTS occupation text,
        ADD COLUMN IF NOT EXISTS height text,
        ADD COLUMN IF NOT EXISTS weight text,
        ADD COLUMN IF NOT EXISTS training_status text;
    `);
    await client.query("COMMIT");
    console.log("Added extra student columns successfully.");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Failed to add extra student columns.", e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
