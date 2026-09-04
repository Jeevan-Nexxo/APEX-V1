-- ============================================================
-- 24: Contact Admin / Queries
-- Students, Visitors and Managers can raise queries to Admin.
-- Each query is a conversation thread (original message +
-- Admin replies + follow-ups) with status open -> replied -> closed.
-- ============================================================

CREATE TABLE IF NOT EXISTS query_threads (
    id SERIAL PRIMARY KEY,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
    last_message_at TIMESTAMP NOT NULL DEFAULT NOW(),
    replied_at TIMESTAMP,
    closed_at TIMESTAMP,
    closed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS query_messages (
    id SERIAL PRIMARY KEY,
    thread_id INT NOT NULL REFERENCES query_threads(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('student', 'visitor', 'manager', 'admin')),
    body TEXT NOT NULL,
    is_admin_reply BOOLEAN NOT NULL DEFAULT FALSE,
    read_by_recipient BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_threads_sender ON query_threads(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_query_threads_status ON query_threads(status);
CREATE INDEX IF NOT EXISTS idx_query_messages_thread ON query_messages(thread_id);

DROP TRIGGER IF EXISTS trigger_query_threads_updated_at ON query_threads;
CREATE TRIGGER trigger_query_threads_updated_at
BEFORE UPDATE ON query_threads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
