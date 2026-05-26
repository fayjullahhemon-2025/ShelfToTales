-- pgvector extension is optional; embeddings are stored as TEXT in vector_data
-- If pgvector is available, also store as native vector type for fast similarity search
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension not available — using TEXT-only embeddings';
END $$;

CREATE TABLE IF NOT EXISTS book_embeddings (
    book_id BIGINT PRIMARY KEY,
    vector_data TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Add native vector column only if pgvector is installed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        ALTER TABLE book_embeddings ADD COLUMN IF NOT EXISTS embedding vector(384);
        CREATE INDEX IF NOT EXISTS book_embeddings_vector_idx ON book_embeddings USING hnsw (embedding vector_cosine_ops);
    END IF;
END $$;
