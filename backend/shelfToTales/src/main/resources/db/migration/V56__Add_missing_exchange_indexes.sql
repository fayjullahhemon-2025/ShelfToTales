-- V56: Add missing index constraints on exchange tables to improve search performance and prevent table locks on delete cascades

-- Index for querying exchange listings by book_id
CREATE INDEX IF NOT EXISTS idx_exchange_listings_book ON exchange_listings(book_id);

-- Index for foreign key offered_book_id to avoid full table scans on book deletions
CREATE INDEX IF NOT EXISTS idx_exchange_requests_offered_book ON exchange_requests(offered_book_id);

-- Index for retrieving exchange requests sent by a specific user (requester history)
CREATE INDEX IF NOT EXISTS idx_exchange_requests_requester ON exchange_requests(requester_id);

-- Index for retrieving exchange ratings submitted by a specific user (rater history)
CREATE INDEX IF NOT EXISTS idx_exchange_ratings_rater ON exchange_ratings(rater_id);
