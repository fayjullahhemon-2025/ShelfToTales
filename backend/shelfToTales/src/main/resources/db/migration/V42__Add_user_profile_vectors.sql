TRUNCATE TABLE book_embeddings;

CREATE TABLE user_profile_vectors (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    vector_data TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
