CREATE TABLE IF NOT EXISTS contact_requests (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL,
    visitor_user_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    message TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by_user_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_requests_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_contact_requests_visitor FOREIGN KEY (visitor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_contact_requests_student FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_contact_requests_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_project_id ON contact_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_visitor_id ON contact_requests(visitor_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_student_id ON contact_requests(student_user_id);
