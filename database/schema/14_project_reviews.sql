CREATE TABLE IF NOT EXISTS project_reviews (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL,
    reviewer_user_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('approved', 'rejected', 'needs_changes')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_reviews_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_reviews_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_reviews_project_id ON project_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_reviewer_id ON project_reviews(reviewer_user_id);
