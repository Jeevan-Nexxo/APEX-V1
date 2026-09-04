-- Schema cleanup migration — SAFE, idempotent, non-destructive.
--
-- NOTE: The live database uses UUID for projects.id and all child project_id
-- columns (they are type-consistent). Earlier drafts of this migration wrongly
-- attempted to cast child project_id columns from UUID to INTEGER, which fails
-- against the live DB. That operation has been removed. This file only applies
-- safe, additive, and dedup fixes.

-- Ensure the missing reviewed_at column exists (idempotent)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Fix the duplicate ON DELETE constraint on project_reviews.reviewer_user_id.
-- The live DB has both fk_project_reviews_reviewer (CASCADE) and the older
-- project_reviews_reviewer_user_id_fkey (SET NULL). We want a single constraint
-- using SET NULL so a deleted user does not cascade-delete review history, and
-- drop the contradictory CASCADE one. Both are dropped to guarantee a clean
-- single definition regardless of order.
ALTER TABLE project_reviews DROP CONSTRAINT IF EXISTS fk_project_reviews_reviewer;
ALTER TABLE project_reviews DROP CONSTRAINT IF EXISTS project_reviews_reviewer_user_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_project_reviews_reviewer'
      AND conrelid = 'project_reviews'::regclass
  ) THEN
    ALTER TABLE project_reviews
      ADD CONSTRAINT fk_project_reviews_reviewer
      FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for token_blacklist cleanup performance (idempotent name)
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Add trigger for team_members updated_at (idempotent)
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_team_members_updated_at ON team_members;
CREATE TRIGGER trigger_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_members_updated_at();

-- Add trigger for user_settings updated_at (idempotent)
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON user_settings;
CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();
