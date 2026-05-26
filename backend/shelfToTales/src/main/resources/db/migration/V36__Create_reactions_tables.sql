CREATE TABLE reactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(30) NOT NULL,
    target_id BIGINT NOT NULL,
    reaction_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_reaction UNIQUE (user_id, target_type, target_id, reaction_type)
);
CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);

CREATE TABLE reaction_counts (
    target_type VARCHAR(30) NOT NULL,
    target_id BIGINT NOT NULL,
    reaction_type VARCHAR(20) NOT NULL,
    count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (target_type, target_id, reaction_type)
);
