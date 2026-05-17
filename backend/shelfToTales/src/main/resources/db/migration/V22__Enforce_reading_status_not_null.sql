-- V22: Enforce NOT NULL on shelf_books.reading_status to match the entity.
--
-- The ShelfBook entity declares `readingStatus` with @Column(nullable = false)
-- and a default of "NOT_STARTED", but V11 created the column with only a
-- DEFAULT clause (no NOT NULL constraint). Backfill any NULLs and then add the
-- NOT NULL constraint so the DB schema matches the entity contract.

UPDATE shelf_books SET reading_status = 'NOT_STARTED' WHERE reading_status IS NULL;

ALTER TABLE shelf_books ALTER COLUMN reading_status SET NOT NULL;
