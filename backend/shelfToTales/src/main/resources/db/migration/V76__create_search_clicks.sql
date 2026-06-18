CREATE TABLE search_clicks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    query TEXT NOT NULL,
    position INT NOT NULL,
    source TEXT,
    ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX search_clicks_user_idx ON search_clicks(user_id, ts DESC);
CREATE INDEX search_clicks_book_idx ON search_clicks(book_id);
