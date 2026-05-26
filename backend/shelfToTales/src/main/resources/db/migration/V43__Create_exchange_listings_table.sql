CREATE TABLE exchange_listings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL,
    condition VARCHAR(10) NOT NULL,
    description VARCHAR(500),
    location VARCHAR(100) NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exchange_listings_status_location ON exchange_listings(status, location);
CREATE INDEX idx_exchange_listings_user ON exchange_listings(user_id);
