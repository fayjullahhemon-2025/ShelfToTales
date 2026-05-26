ALTER TABLE books ADD COLUMN mood_tags VARCHAR(255);

UPDATE books SET mood_tags = 'melancholic,reflective' WHERE id = 1;
UPDATE books SET mood_tags = 'cozy,adventurous' WHERE id = 2;
UPDATE books SET mood_tags = 'reflective' WHERE id = 3;
UPDATE books SET mood_tags = 'suspenseful,melancholic' WHERE id = 4;
UPDATE books SET mood_tags = 'adventurous,suspenseful' WHERE id = 5;
UPDATE books SET mood_tags = 'reflective' WHERE id = 6;
UPDATE books SET mood_tags = 'melancholic,reflective' WHERE id = 7;
UPDATE books SET mood_tags = 'adventurous,cozy' WHERE id = 8;
UPDATE books SET mood_tags = 'reflective' WHERE id = 9;
UPDATE books SET mood_tags = 'cozy,reflective' WHERE id = 10;
