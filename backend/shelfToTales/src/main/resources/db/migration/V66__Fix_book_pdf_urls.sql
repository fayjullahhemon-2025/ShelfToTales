-- Fix dead PDF URLs: replace fictional sample-books.shelftotales.com with real Project Gutenberg links
-- Gutenberg serves EPUB downloads (not PDF), so we use the EPUB3 download URLs.
-- These are free, legal, and permanently available from gutenberg.org.
-- For books not on Gutenberg (still under copyright), we use thematically
-- appropriate public-domain texts as placeholders.

-- The Great Gatsby (public domain in US as of 2021, Gutenberg #64317)
UPDATE books SET pdf_url = 'https://www.gutenberg.org/ebooks/64317.epub3.images' WHERE isbn = '9780743273565';

-- The Hobbit (not public domain; placeholder: Grimms' Fairy Tales #2591)
UPDATE books SET pdf_url = 'https://www.gutenberg.org/ebooks/2591.epub3.images' WHERE isbn = '9780547928227';

-- A Brief History of Time (not public domain; placeholder: Leviathan by Hobbes #3207)
UPDATE books SET pdf_url = 'https://www.gutenberg.org/ebooks/3207.epub3.images' WHERE isbn = '9780553380163';

-- 1984 by George Orwell (not public domain; placeholder: Frankenstein #84)
UPDATE books SET pdf_url = 'https://www.gutenberg.org/ebooks/84.epub3.images' WHERE isbn = '9780451524935';

-- Dune (not public domain; placeholder: Moby Dick #2701)
UPDATE books SET pdf_url = 'https://www.gutenberg.org/ebooks/2701.epub3.images' WHERE isbn = '9780441172719';

-- Sapiens (not public domain; placeholder: The Picture of Dorian Gray #174)
UPDATE books SET pdf_url = 'https://www.gutenberg.org/ebooks/174.epub3.images' WHERE isbn = '9780062316097';

-- To Kill a Mockingbird (not public domain; placeholder: Uncle Tom's Cabin #1952)
UPDATE books SET pdf_url = 'https://www.gutenberg.org/ebooks/1952.epub3.images' WHERE isbn = '9780061120084';

-- The Name of the Wind (not public domain; placeholder: Dracula #16328)
UPDATE books SET pdf_url = 'https://www.gutenberg.org/ebooks/16328.epub3.images' WHERE isbn = '9780756404741';

-- Cosmos by Carl Sagan (not public domain; placeholder: The Adventures of Tom Sawyer #74)
UPDATE books SET pdf_url = 'https://www.gutenberg.org/ebooks/74.epub3.images' WHERE isbn = '9780345539434';

-- Pride and Prejudice by Jane Austen (public domain, Gutenberg #1342)
UPDATE books SET pdf_url = 'https://www.gutenberg.org/ebooks/1342.epub3.images' WHERE isbn = '9780141439518';
