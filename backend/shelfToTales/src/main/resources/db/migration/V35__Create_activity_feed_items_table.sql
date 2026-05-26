CREATE TABLE activity_feed_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(30) NOT NULL,
    reference_id BIGINT,
    reference_type VARCHAR(30),
    metadata JSONB,
    visibility VARCHAR(10) NOT NULL DEFAULT 'PUBLIC',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_feed_user_created ON activity_feed_items(user_id, created_at DESC);
CREATE INDEX idx_feed_created ON activity_feed_items(created_at DESC);
