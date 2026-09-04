-- Seed data for testing
-- Password for all users: "password123"
-- NOTE: The bcrypt hashes below match "password123" (bcrypt, 10 rounds).
-- If you want to regenerate them, run:  server/scripts/seed.js  (recommended)

INSERT INTO users (full_name, email, password_hash, role, email_verified) VALUES
  ('Admin User', 'admin@apex.com', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmD5xVJmGywtgFq5Y1fS', 'admin', TRUE),
  ('John Student', 'john@student.com', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmD5xVJmGywtgFq5Y1fS', 'student', TRUE),
  ('Jane Student', 'jane@student.com', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmD5xVJmGywtgFq5Y1fS', 'student', TRUE),
  ('Visitor User', 'visitor@apex.com', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmD5xVJmGywtgFq5Y1fS', 'visitor', TRUE),
  ('Manager User', 'manager@apex.com', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmD5xVJmGywtgFq5Y1fS', 'manager', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Student profiles for seeded students
INSERT INTO student_profiles (user_id, college, department, year_of_study)
SELECT id, 'APEX College', 'Computer Science', '3rd Year'
FROM users
WHERE email = 'john@student.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO student_profiles (user_id, college, department, year_of_study)
SELECT id, 'APEX College', 'Information Technology', '4th Year'
FROM users
WHERE email = 'jane@student.com'
ON CONFLICT (user_id) DO NOTHING;

-- Visitor profile for seeded visitor
INSERT INTO visitor_profiles (user_id, phone, organization, purpose)
SELECT id, '9876543210', 'TechCorp', 'Research'
FROM users
WHERE email = 'visitor@apex.com'
ON CONFLICT (user_id) DO NOTHING;
