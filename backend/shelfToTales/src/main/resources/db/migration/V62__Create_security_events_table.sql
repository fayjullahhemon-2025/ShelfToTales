CREATE TABLE security_events (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(60) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    client_ip VARCHAR(80),
    method VARCHAR(12),
    path VARCHAR(300),
    principal VARCHAR(180),
    message VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX idx_security_events_type_created_at ON security_events(type, created_at DESC);
