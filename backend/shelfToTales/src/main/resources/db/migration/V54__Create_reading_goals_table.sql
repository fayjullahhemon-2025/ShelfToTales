CREATE TABLE reading_goals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_year INT NOT NULL,
    target_count INT NOT NULL CHECK (target_count > 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_year_goal UNIQUE (user_id, target_year)
);
CREATE INDEX idx_reading_goals_user ON reading_goals(user_id);
