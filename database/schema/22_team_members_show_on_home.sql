ALTER TABLE team_members ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_team_members_show_on_homepage ON team_members(show_on_homepage);
