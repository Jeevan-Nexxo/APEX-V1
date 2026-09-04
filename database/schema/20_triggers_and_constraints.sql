-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to users table
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to projects table
DROP TRIGGER IF EXISTS trigger_projects_updated_at ON projects;
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to categories table
DROP TRIGGER IF EXISTS trigger_categories_updated_at ON categories;
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to student_profiles table
DROP TRIGGER IF EXISTS trigger_student_profiles_updated_at ON student_profiles;
CREATE TRIGGER trigger_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to visitor_profiles table
DROP TRIGGER IF EXISTS trigger_visitor_profiles_updated_at ON visitor_profiles;
CREATE TRIGGER trigger_visitor_profiles_updated_at
  BEFORE UPDATE ON visitor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to notifications table
DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix project_reviews FK: CASCADE -> SET NULL for reviewer
ALTER TABLE project_reviews
  DROP CONSTRAINT IF EXISTS project_reviews_reviewer_user_id_fkey,
  ADD CONSTRAINT project_reviews_reviewer_user_id_fkey
    FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add account_status CHECK constraint
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('active', 'blocked'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add projects.slug NOT NULL
ALTER TABLE projects ALTER COLUMN slug SET NOT NULL;
