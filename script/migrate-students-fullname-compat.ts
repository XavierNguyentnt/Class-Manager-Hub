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
    // Make full_name nullable to allow inserts without it
    await client.query(`DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='students' AND column_name='full_name'
      ) THEN
        EXECUTE 'ALTER TABLE public.students ALTER COLUMN full_name DROP NOT NULL';
      END IF;
    END $$;`);

    // Backfill full_name where null using last_name + ' ' + first_name
    await client.query(`UPDATE public.students
      SET full_name = trim(both ' ' from coalesce(last_name,'') || ' ' || coalesce(first_name,''))
      WHERE (full_name IS NULL OR full_name = '')
        AND (first_name IS NOT NULL OR last_name IS NOT NULL);`);

    // Create trigger to auto-populate full_name on insert/update for compatibility
    await client.query(`
      CREATE OR REPLACE FUNCTION public.set_students_full_name()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.full_name IS NULL OR NEW.full_name = '' THEN
          NEW.full_name := trim(both ' ' from coalesce(NEW.last_name,'') || ' ' || coalesce(NEW.first_name,''));
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'students_full_name_fill'
        ) THEN
          CREATE TRIGGER students_full_name_fill
          BEFORE INSERT OR UPDATE ON public.students
          FOR EACH ROW
          EXECUTE FUNCTION public.set_students_full_name();
        END IF;
      END $$;
    `);

    await client.query("COMMIT");
    console.log("Adjusted students.full_name constraint and added compatibility trigger.");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Failed to adjust students.full_name.", e);
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
