CREATE TABLE exchange_requests (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES exchange_listings(id) ON DELETE CASCADE,
    requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message VARCHAR(300),
    offered_book_id BIGINT REFERENCES books(id),
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_exchange_request UNIQUE (listing_id, requester_id)
);
CREATE INDEX idx_exchange_requests_listing ON exchange_requests(listing_id, status);
