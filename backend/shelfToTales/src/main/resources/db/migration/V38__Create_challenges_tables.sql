CREATE TABLE reading_challenges (
    id BIGSERIAL PRIMARY KEY,
    creator_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    type VARCHAR(20) NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_value INT NOT NULL,
    genre_filter VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_challenges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id BIGINT NOT NULL REFERENCES reading_challenges(id) ON DELETE CASCADE,
    progress INT NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_challenge UNIQUE (user_id, challenge_id)
);
CREATE INDEX idx_user_challenges_user ON user_challenges(user_id, completed);
