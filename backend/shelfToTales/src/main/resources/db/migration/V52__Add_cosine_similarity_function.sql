-- SQL-based cosine similarity function for book recommendations
-- Works without pgvector extension by computing similarity on TEXT-stored vectors
-- If pgvector IS installed, the native vector(384) column + HNSW index is faster

CREATE OR REPLACE FUNCTION cosine_similarity(a TEXT, b TEXT)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    arr_a DOUBLE PRECISION[];
    arr_b DOUBLE PRECISION[];
    dot_product DOUBLE PRECISION := 0;
    norm_a DOUBLE PRECISION := 0;
    norm_b DOUBLE PRECISION := 0;
    i INTEGER;
BEGIN
    IF a IS NULL OR b IS NULL OR a = '' OR b = '' THEN RETURN 0; END IF;
    arr_a := string_to_array(a, ',')::DOUBLE PRECISION[];
    arr_b := string_to_array(b, ',')::DOUBLE PRECISION[];
    IF array_length(arr_a, 1) != array_length(arr_b, 1) THEN RETURN 0; END IF;
    FOR i IN 1..array_length(arr_a, 1) LOOP
        dot_product := dot_product + arr_a[i] * arr_b[i];
        norm_a := norm_a + arr_a[i] * arr_a[i];
        norm_b := norm_b + arr_b[i] * arr_b[i];
    END LOOP;
    IF norm_a = 0 OR norm_b = 0 THEN RETURN 0; END IF;
    RETURN dot_product / (sqrt(norm_a) * sqrt(norm_b));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
