-- Migration 002: Extend Products Table  
-- Generated from data-model.md specifications
-- Date: 2025-09-10

-- Add new columns to existing products table
-- Note: SQLite can't add UNIQUE constraints to existing tables, so we'll add the column first
ALTER TABLE products ADD COLUMN sku TEXT;
ALTER TABLE products ADD COLUMN brand TEXT;
ALTER TABLE products ADD COLUMN description TEXT;
ALTER TABLE products ADD COLUMN category_id INTEGER;
ALTER TABLE products ADD COLUMN inventory_status TEXT DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN inventory_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN weight_grams INTEGER;
ALTER TABLE products ADD COLUMN dimensions_cm TEXT;
ALTER TABLE products ADD COLUMN primary_image_url TEXT;
ALTER TABLE products ADD COLUMN tags TEXT;
ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Add foreign key constraint for category relationship
-- Note: SQLite doesn't support ADD CONSTRAINT directly, handled via triggers
CREATE INDEX idx_products_category ON products(category_id);

-- Create additional indexes for new fields
-- Create unique index for SKU to enforce uniqueness
CREATE UNIQUE INDEX idx_products_sku_unique ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_brand ON products(brand COLLATE NOCASE);
CREATE INDEX idx_products_inventory_status ON products(inventory_status);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Composite indexes for common admin queries
CREATE INDEX idx_products_active_status ON products(is_active, inventory_status);
CREATE INDEX idx_products_category_active ON products(category_id, is_active);

-- Create trigger to validate inventory_status values
CREATE TRIGGER validate_inventory_status_before_insert
    BEFORE INSERT ON products
BEGIN
    SELECT CASE
        WHEN NEW.inventory_status NOT IN ('in_stock', 'out_of_stock', 'low_stock')
        THEN RAISE(ABORT, 'Invalid inventory_status. Must be: in_stock, out_of_stock, or low_stock')
    END;
END;

CREATE TRIGGER validate_inventory_status_before_update
    BEFORE UPDATE ON products
BEGIN
    SELECT CASE
        WHEN NEW.inventory_status NOT IN ('in_stock', 'out_of_stock', 'low_stock')
        THEN RAISE(ABORT, 'Invalid inventory_status. Must be: in_stock, out_of_stock, or low_stock')
    END;
END;

-- Create trigger to validate category relationship
CREATE TRIGGER validate_category_before_insert
    BEFORE INSERT ON products
BEGIN
    SELECT CASE
        WHEN NEW.category_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM categories WHERE id = NEW.category_id AND is_active = TRUE)
        THEN RAISE(ABORT, 'Invalid category_id. Category must exist and be active.')
    END;
END;

CREATE TRIGGER validate_category_before_update
    BEFORE UPDATE ON products
BEGIN
    SELECT CASE
        WHEN NEW.category_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM categories WHERE id = NEW.category_id AND is_active = TRUE)
        THEN RAISE(ABORT, 'Invalid category_id. Category must exist and be active.')
    END;
END;

-- Update the existing timestamp trigger to handle the updated_at column
-- (The updated_at column already exists from previous schema)
DROP TRIGGER IF EXISTS update_products_timestamp;
CREATE TRIGGER update_products_timestamp 
    AFTER UPDATE ON products
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;