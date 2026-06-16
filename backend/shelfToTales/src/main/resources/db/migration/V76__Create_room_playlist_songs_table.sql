CREATE TABLE room_playlist_songs (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES reading_rooms(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(200),
    file_url VARCHAR(500) NOT NULL,
    cover_url VARCHAR(500),
    duration_seconds INT,
    sort_order INT NOT NULL DEFAULT 0,
    added_by_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_room_playlist_songs_room_id ON room_playlist_songs(room_id);
CREATE INDEX idx_room_playlist_songs_added_by_id ON room_playlist_songs(added_by_id);
