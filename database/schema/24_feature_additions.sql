-- APEX V1 Feature Additions
-- 1. Add is_public flag to projects for public showcase
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Index for public project queries
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);

-- 2. Add identity proof columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_proof_path TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_proof_original_name VARCHAR(255);

-- 3. Add category icon columns
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_path TEXT;

-- 4. Create queries table for in-app communication
CREATE TABLE IF NOT EXISTS queries (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    reply TEXT,
    replied_by_user_id UUID,
    replied_at TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_queries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_queries_replier FOREIGN KEY (replied_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at DESC);

-- 5. Create faq_categories and faq_items tables for Help Center
CREATE TABLE IF NOT EXISTS faq_categories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faq_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_faq_category FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_faq_items_category ON faq_items(category_id);

-- 6. Add contact_request email tracking for visitor contact workflow
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS visitor_email VARCHAR(255);
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS student_email VARCHAR(255);

-- 7. Add triggers for new tables' updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_queries_updated_at ON queries;
CREATE TRIGGER trigger_queries_updated_at
    BEFORE UPDATE ON queries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_faq_categories_updated_at ON faq_categories;
CREATE TRIGGER trigger_faq_categories_updated_at
    BEFORE UPDATE ON faq_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_faq_items_updated_at ON faq_items;
CREATE TRIGGER trigger_faq_items_updated_at
    BEFORE UPDATE ON faq_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();