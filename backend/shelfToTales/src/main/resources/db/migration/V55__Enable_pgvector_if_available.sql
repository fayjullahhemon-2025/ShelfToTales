-- Attempt to enable the vector extension
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension not available — using PL/pgSQL fallback';
END $$;

-- Setup embedding column and migrate existing values
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        -- Add column if not exists
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'book_embeddings' AND column_name = 'embedding'
        ) THEN
            ALTER TABLE book_embeddings ADD COLUMN embedding vector(384);
        END IF;

        -- Add HNSW index
        CREATE INDEX IF NOT EXISTS book_embeddings_vector_idx ON book_embeddings USING hnsw (embedding vector_cosine_ops);

        -- Populate existing embeddings from vector_data
        UPDATE book_embeddings 
        SET embedding = CAST('[' || vector_data || ']' AS vector) 
        WHERE embedding IS NULL AND vector_data IS NOT NULL AND vector_data <> '';
      END IF;
END $$;
