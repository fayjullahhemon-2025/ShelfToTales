CREATE TABLE friend_requests (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_friend_request UNIQUE (sender_id, receiver_id),
    CONSTRAINT chk_no_self_request CHECK (sender_id <> receiver_id)
);
CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_id, status);
