CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE book_embeddings (
    book_id BIGINT PRIMARY KEY,
    vector_data TEXT NOT NULL,
    embedding vector(384),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS book_embeddings_vector_idx ON book_embeddings USING hnsw (embedding vector_cosine_ops);
