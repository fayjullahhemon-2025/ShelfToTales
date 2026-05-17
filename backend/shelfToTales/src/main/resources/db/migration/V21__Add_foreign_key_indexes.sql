-- V21: Add foreign-key indexes that were missing.
--
-- This migration is written defensively with `IF NOT EXISTS` because several
-- of the indexes it originally tried to create were already created in earlier
-- migrations (V6, V8, V9, V11). Without IF NOT EXISTS, this migration would
-- fail to apply on a fresh database. We also fix one column-name typo: the
-- shelf_books table joins to bookshelves via `shelf_id`, not `bookshelf_id`
-- (see V11__Create_shelf_books_join_table.sql).

-- books.category_id (already created in V6 as idx_books_category_id)
CREATE INDEX IF NOT EXISTS idx_books_category_id ON books(category_id);

-- wishlist_items (V12 created idx_wishlist_user_id; we add the matching pair here)
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_book_id ON wishlist_items(book_id);

-- cart_items (V9 created idx_cart_items_user_id)
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_book_id ON cart_items(book_id);

-- bookshelves (V8 created idx_bookshelves_user_id)
CREATE INDEX IF NOT EXISTS idx_bookshelves_user_id ON bookshelves(user_id);

-- shelf_books (V11 created idx_shelf_books_shelf_id and idx_shelf_books_book_id).
-- The original V21 referenced a non-existent `bookshelf_id` column; the
-- correct column name is `shelf_id`.
CREATE INDEX IF NOT EXISTS idx_shelf_books_shelf_id ON shelf_books(shelf_id);
CREATE INDEX IF NOT EXISTS idx_shelf_books_book_id ON shelf_books(book_id);
