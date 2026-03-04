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
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;`);

    // 1) Add UUID id columns
    await client.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS id_uuid uuid;`);
    await client.query(`UPDATE users SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;`);

    await client.query(`ALTER TABLE IF EXISTS classes ADD COLUMN IF NOT EXISTS id_uuid uuid;`);
    await client.query(`UPDATE classes SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;`);

    await client.query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS id_uuid uuid;`);
    await client.query(`UPDATE students SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;`);

    await client.query(`ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS id_uuid uuid;`);
    await client.query(`UPDATE transactions SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;`);

    await client.query(`ALTER TABLE IF EXISTS attendances ADD COLUMN IF NOT EXISTS id_uuid uuid;`);
    await client.query(`UPDATE attendances SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;`);

    await client.query(`ALTER TABLE IF EXISTS class_monitors ADD COLUMN IF NOT EXISTS id_uuid uuid;`);
    await client.query(`UPDATE class_monitors SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;`);

    // 2) Add UUID FK columns and backfill
    await client.query(`ALTER TABLE IF EXISTS classes ADD COLUMN IF NOT EXISTS teacher_id_uuid uuid;`);
    await client.query(`
      UPDATE classes SET teacher_id_uuid = u.id_uuid
      FROM users u
      WHERE u.id = classes.teacher_id;
    `);

    await client.query(`ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS class_id_uuid uuid;`);
    await client.query(`
      UPDATE students SET class_id_uuid = c.id_uuid
      FROM classes c
      WHERE c.id = students.class_id;
    `);

    await client.query(`ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS class_id_uuid uuid;`);
    await client.query(`
      UPDATE transactions SET class_id_uuid = c.id_uuid
      FROM classes c
      WHERE c.id = transactions.class_id;
    `);
    await client.query(`ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS created_by_uuid uuid;`);
    await client.query(`
      UPDATE transactions SET created_by_uuid = u.id_uuid
      FROM users u
      WHERE u.id = transactions.created_by;
    `);

    await client.query(`ALTER TABLE IF EXISTS attendances ADD COLUMN IF NOT EXISTS class_id_uuid uuid;`);
    await client.query(`
      UPDATE attendances SET class_id_uuid = c.id_uuid
      FROM classes c
      WHERE c.id = attendances.class_id;
    `);
    await client.query(`ALTER TABLE IF EXISTS attendances ADD COLUMN IF NOT EXISTS student_id_uuid uuid;`);
    await client.query(`
      UPDATE attendances SET student_id_uuid = s.id_uuid
      FROM students s
      WHERE s.id = attendances.student_id;
    `);
    await client.query(`ALTER TABLE IF EXISTS attendances ADD COLUMN IF NOT EXISTS created_by_uuid uuid;`);
    await client.query(`
      UPDATE attendances SET created_by_uuid = u.id_uuid
      FROM users u
      WHERE u.id = attendances.created_by;
    `);

    await client.query(`ALTER TABLE IF EXISTS class_monitors ADD COLUMN IF NOT EXISTS class_id_uuid uuid;`);
    await client.query(`
      UPDATE class_monitors SET class_id_uuid = c.id_uuid
      FROM classes c
      WHERE c.id = class_monitors.class_id;
    `);
    await client.query(`ALTER TABLE IF EXISTS class_monitors ADD COLUMN IF NOT EXISTS monitor_id_uuid uuid;`);
    await client.query(`
      UPDATE class_monitors SET monitor_id_uuid = u.id_uuid
      FROM users u
      WHERE u.id = class_monitors.monitor_id;
    `);

    // 3) Drop PKs on old id columns
    await client.query(`ALTER TABLE IF EXISTS attendances DROP CONSTRAINT IF EXISTS attendances_pkey;`);
    await client.query(`ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_pkey;`);
    await client.query(`ALTER TABLE IF EXISTS students DROP CONSTRAINT IF EXISTS students_pkey;`);
    await client.query(`ALTER TABLE IF EXISTS class_monitors DROP CONSTRAINT IF EXISTS class_monitors_pkey;`);
    await client.query(`ALTER TABLE IF EXISTS classes DROP CONSTRAINT IF EXISTS classes_pkey;`);
    await client.query(`ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_pkey;`);

    // 4) Replace id columns
    await client.query(`ALTER TABLE IF EXISTS users ALTER COLUMN id DROP DEFAULT;`);
    await client.query(`ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS id;`);
    await client.query(`ALTER TABLE IF EXISTS users RENAME COLUMN id_uuid TO id;`);
    await client.query(`ALTER TABLE IF EXISTS users ADD CONSTRAINT users_pkey PRIMARY KEY (id);`);

    await client.query(`ALTER TABLE IF EXISTS classes DROP COLUMN IF EXISTS id;`);
    await client.query(`ALTER TABLE IF EXISTS classes RENAME COLUMN id_uuid TO id;`);
    await client.query(`ALTER TABLE IF EXISTS classes DROP COLUMN IF EXISTS teacher_id;`);
    await client.query(`ALTER TABLE IF EXISTS classes RENAME COLUMN teacher_id_uuid TO teacher_id;`);
    await client.query(`ALTER TABLE IF EXISTS classes ADD CONSTRAINT classes_pkey PRIMARY KEY (id);`);
    await client.query(`ALTER TABLE IF EXISTS classes ALTER COLUMN teacher_id SET NOT NULL;`);

    await client.query(`ALTER TABLE IF EXISTS students DROP COLUMN IF EXISTS id;`);
    await client.query(`ALTER TABLE IF EXISTS students RENAME COLUMN id_uuid TO id;`);
    await client.query(`ALTER TABLE IF EXISTS students DROP COLUMN IF EXISTS class_id;`);
    await client.query(`ALTER TABLE IF EXISTS students RENAME COLUMN class_id_uuid TO class_id;`);
    await client.query(`ALTER TABLE IF EXISTS students ADD CONSTRAINT students_pkey PRIMARY KEY (id);`);
    await client.query(`ALTER TABLE IF EXISTS students ALTER COLUMN class_id SET NOT NULL;`);

    await client.query(`ALTER TABLE IF EXISTS transactions DROP COLUMN IF EXISTS id;`);
    await client.query(`ALTER TABLE IF EXISTS transactions RENAME COLUMN id_uuid TO id;`);
    await client.query(`ALTER TABLE IF EXISTS transactions DROP COLUMN IF EXISTS class_id;`);
    await client.query(`ALTER TABLE IF EXISTS transactions RENAME COLUMN class_id_uuid TO class_id;`);
    await client.query(`ALTER TABLE IF EXISTS transactions DROP COLUMN IF EXISTS created_by;`);
    await client.query(`ALTER TABLE IF EXISTS transactions RENAME COLUMN created_by_uuid TO created_by;`);
    await client.query(`ALTER TABLE IF EXISTS transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);`);
    await client.query(`ALTER TABLE IF EXISTS transactions ALTER COLUMN class_id SET NOT NULL;`);
    await client.query(`ALTER TABLE IF EXISTS transactions ALTER COLUMN created_by SET NOT NULL;`);

    await client.query(`ALTER TABLE IF EXISTS attendances DROP COLUMN IF EXISTS id;`);
    await client.query(`ALTER TABLE IF EXISTS attendances RENAME COLUMN id_uuid TO id;`);
    await client.query(`ALTER TABLE IF EXISTS attendances DROP COLUMN IF EXISTS class_id;`);
    await client.query(`ALTER TABLE IF EXISTS attendances RENAME COLUMN class_id_uuid TO class_id;`);
    await client.query(`ALTER TABLE IF EXISTS attendances DROP COLUMN IF EXISTS student_id;`);
    await client.query(`ALTER TABLE IF EXISTS attendances RENAME COLUMN student_id_uuid TO student_id;`);
    await client.query(`ALTER TABLE IF EXISTS attendances DROP COLUMN IF EXISTS created_by;`);
    await client.query(`ALTER TABLE IF EXISTS attendances RENAME COLUMN created_by_uuid TO created_by;`);
    await client.query(`ALTER TABLE IF EXISTS attendances ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);`);
    await client.query(`ALTER TABLE IF EXISTS attendances ALTER COLUMN class_id SET NOT NULL;`);
    await client.query(`ALTER TABLE IF EXISTS attendances ALTER COLUMN student_id SET NOT NULL;`);
    await client.query(`ALTER TABLE IF EXISTS attendances ALTER COLUMN created_by SET NOT NULL;`);

    await client.query(`ALTER TABLE IF EXISTS class_monitors DROP COLUMN IF EXISTS id;`);
    await client.query(`ALTER TABLE IF EXISTS class_monitors RENAME COLUMN id_uuid TO id;`);
    await client.query(`ALTER TABLE IF EXISTS class_monitors DROP COLUMN IF EXISTS class_id;`);
    await client.query(`ALTER TABLE IF EXISTS class_monitors RENAME COLUMN class_id_uuid TO class_id;`);
    await client.query(`ALTER TABLE IF EXISTS class_monitors DROP COLUMN IF EXISTS monitor_id;`);
    await client.query(`ALTER TABLE IF EXISTS class_monitors RENAME COLUMN monitor_id_uuid TO monitor_id;`);
    await client.query(`ALTER TABLE IF EXISTS class_monitors ADD CONSTRAINT class_monitors_pkey PRIMARY KEY (id);`);
    await client.query(`ALTER TABLE IF EXISTS class_monitors ALTER COLUMN class_id SET NOT NULL;`);
    await client.query(`ALTER TABLE IF EXISTS class_monitors ALTER COLUMN monitor_id SET NOT NULL;`);

    // 5) Drop old sequences
    await client.query(`DROP SEQUENCE IF EXISTS attendances_id_seq;`);
    await client.query(`DROP SEQUENCE IF EXISTS class_monitors_id_seq;`);
    await client.query(`DROP SEQUENCE IF EXISTS classes_id_seq;`);
    await client.query(`DROP SEQUENCE IF EXISTS students_id_seq;`);
    await client.query(`DROP SEQUENCE IF EXISTS transactions_id_seq;`);
    await client.query(`DROP SEQUENCE IF EXISTS users_id_seq;`);

    // 6) Add foreign keys
    await client.query(`ALTER TABLE classes ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES users(id);`);
    await client.query(`ALTER TABLE students ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;`);
    await client.query(`ALTER TABLE transactions ADD CONSTRAINT transactions_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;`);
    await client.query(`ALTER TABLE transactions ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);`);
    await client.query(`ALTER TABLE attendances ADD CONSTRAINT attendances_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;`);
    await client.query(`ALTER TABLE attendances ADD CONSTRAINT attendances_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;`);
    await client.query(`ALTER TABLE attendances ADD CONSTRAINT attendances_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);`);
    await client.query(`ALTER TABLE class_monitors ADD CONSTRAINT class_monitors_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;`);
    await client.query(`ALTER TABLE class_monitors ADD CONSTRAINT class_monitors_monitor_id_fkey FOREIGN KEY (monitor_id) REFERENCES users(id);`);

    await client.query("COMMIT");
    console.log("Migration completed successfully.");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Migration failed. Rolled back.", e);
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
