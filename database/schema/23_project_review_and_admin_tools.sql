-- Aligns the live projects table with the V1 codebase and adds admin review/user tools.
-- All statements are guarded/idempotent so they apply safely to any environment.

-- 1. This deployment's legacy projects table carries NOT NULL legacy columns
--    (student_id, categories text[]) that V1 code does not write (V1 uses
--    created_by_user_id + project_categories junction). Make them nullable so
--    student submission works. No-op when columns do not exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'student_id') THEN
    ALTER TABLE projects ALTER COLUMN student_id DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'categories') THEN
    ALTER TABLE projects ALTER COLUMN categories DROP NOT NULL;
  END IF;
END $$;

-- 2. Explicit review timestamp for the ONE current review state.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- 3. Admin-only verification/notes field. Never exposed outside admin endpoints.
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 4. Backfill reviewed_at from the current review record where possible.
UPDATE projects p
SET reviewed_at = r.latest_review_at
FROM (
  SELECT project_id, MAX(created_at) AS latest_review_at
  FROM project_reviews
  GROUP BY project_id
) r
WHERE p.id = r.project_id
  AND p.reviewed_by_user_id IS NOT NULL
  AND p.reviewed_at IS NULL;
