CREATE TABLE user_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reference_type VARCHAR(30),
    reference_id BIGINT,
    message VARCHAR(255) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_unread ON user_notifications(user_id, read, created_at DESC);
