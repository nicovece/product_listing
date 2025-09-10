-- Migration 001: Add Categories Table
-- Generated from data-model.md specifications
-- Date: 2025-09-10

-- Create categories table with hierarchical support
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_category_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id)
);

-- Create indexes for efficient category queries
CREATE INDEX idx_categories_name ON categories(name COLLATE NOCASE);
CREATE INDEX idx_categories_parent ON categories(parent_category_id);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_sort ON categories(parent_category_id, sort_order);

-- Create triggers to update updated_at timestamp
CREATE TRIGGER update_categories_timestamp 
    AFTER UPDATE ON categories
BEGIN
    UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert default root categories for initial setup
INSERT INTO categories (name, description, sort_order) VALUES 
    ('Electronics', 'Electronic devices and gadgets', 1),
    ('Clothing', 'Apparel and accessories', 2),
    ('Home & Garden', 'Home improvement and garden supplies', 3),
    ('Books', 'Books and educational materials', 4),
    ('Sports', 'Sports equipment and fitness gear', 5);

-- Insert some subcategories as examples
INSERT INTO categories (name, description, parent_category_id, sort_order) VALUES 
    ('Computers', 'Computers and computer accessories', 1, 1),
    ('Audio', 'Headphones, speakers, and audio equipment', 1, 2),
    ('Mobile', 'Mobile phones and accessories', 1, 3);