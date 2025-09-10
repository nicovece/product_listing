-- Product Listing Database Schema
-- Generated from data-model.md specifications

-- Drop table if exists (for development reset)
DROP TABLE IF EXISTS products;

-- Create products table
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 255),
    price DECIMAL(10,2) NOT NULL CHECK(price >= 0.01 AND price <= 9999.99),
    likes INTEGER NOT NULL DEFAULT 0 CHECK(likes >= 0 AND likes <= 999999),
    imageUrl TEXT NOT NULL CHECK(imageUrl LIKE 'https://%'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient filtering and sorting
-- Reference: data-model.md indexing requirements
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_likes ON products(likes); 
CREATE INDEX idx_products_name ON products(name COLLATE NOCASE);

-- Composite index for common query patterns
CREATE INDEX idx_products_price_likes ON products(price, likes);