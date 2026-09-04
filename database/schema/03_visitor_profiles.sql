CREATE TABLE IF NOT EXISTS visitor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE NOT NULL,

    phone VARCHAR(20) NOT NULL,

    organization VARCHAR(255),

    purpose VARCHAR(100) NOT NULL,

    phone_verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_visitor_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_visitor_profiles_user_id ON visitor_profiles(user_id);
