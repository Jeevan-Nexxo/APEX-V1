ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_categories_show_on_homepage ON categories(show_on_homepage);
CREATE INDEX IF NOT EXISTS idx_projects_is_featured ON projects(is_featured);
