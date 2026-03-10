CREATE TABLE IF NOT EXISTS student_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  effective_from TEXT NOT NULL,
  effective_to TEXT NULL,
  note TEXT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

INSERT INTO student_suspensions (class_id, student_id, effective_from, effective_to, note, created_by)
SELECT
  s.class_id,
  s.id,
  s.suspend_from,
  NULL,
  'Migrated from students.suspend_from',
  (SELECT u.id FROM users u ORDER BY u.created_at ASC LIMIT 1)
FROM students s
WHERE s.suspend_from IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM student_suspensions ss WHERE ss.student_id = s.id
  );
