ALTER TABLE orders ADD COLUMN shipping_address_id BIGINT REFERENCES shipping_addresses(id);
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) DEFAULT 'COD';
ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(30);
