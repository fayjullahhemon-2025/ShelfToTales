CREATE TABLE exchange_ratings (
    id BIGSERIAL PRIMARY KEY,
    exchange_request_id BIGINT NOT NULL REFERENCES exchange_requests(id) ON DELETE CASCADE,
    rater_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ratee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    comment VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_exchange_rating UNIQUE (exchange_request_id, rater_id)
);
CREATE INDEX idx_exchange_ratings_ratee ON exchange_ratings(ratee_id);
