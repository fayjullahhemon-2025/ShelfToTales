CREATE TABLE friendships (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    since TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_friendship UNIQUE (user_id, friend_id)
);
CREATE INDEX idx_friendships_user ON friendships(user_id);
