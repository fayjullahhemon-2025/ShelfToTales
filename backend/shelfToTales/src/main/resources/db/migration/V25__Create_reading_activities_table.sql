CREATE TABLE reading_activities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    book_id BIGINT NOT NULL REFERENCES books(id),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMP NOT NULL DEFAULT NOW(),
    total_pages_read INTEGER NOT NULL DEFAULT 0,
    current_page INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reading_activities_user_id ON reading_activities(user_id);
CREATE INDEX idx_reading_activities_user_status ON reading_activities(user_id, status);
