# Data Model: Product Content Management System

**Date**: 2025-09-10  
**Feature**: 002-add-comprehensive-product  

## Entity Definitions

### Product Entity
**Purpose**: Represents items in the product catalog with complete management information

**Fields**:
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT - Unique product identifier
- `name`: TEXT NOT NULL - Product display name (max 255 chars)
- `description`: TEXT - Detailed product description (max 2000 chars)
- `sku`: TEXT UNIQUE - Stock keeping unit identifier (max 50 chars)
- `brand`: TEXT - Product brand/manufacturer (max 100 chars)  
- `price`: DECIMAL(10,2) NOT NULL - Product price in cents (stored as integer)
- `category_id`: INTEGER - Foreign key to Category entity
- `inventory_status`: TEXT NOT NULL - Enum: 'in_stock', 'out_of_stock', 'low_stock'
- `inventory_count`: INTEGER DEFAULT 0 - Optional quantity tracking
- `weight_grams`: INTEGER - Product weight in grams
- `dimensions_cm`: TEXT - JSON string: {"length": 0, "width": 0, "height": 0}
- `primary_image_url`: TEXT - URL to primary product image
- `tags`: TEXT - JSON array of tag strings
- `is_active`: BOOLEAN DEFAULT TRUE - Soft delete flag
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

**Validation Rules**:
- name: Required, 1-255 characters
- price: Required, positive integer (cents)  
- sku: Optional, unique if provided, alphanumeric + hyphens
- inventory_status: Required, must be valid enum value
- inventory_count: Non-negative integer
- weight_grams: Positive integer if provided
- primary_image_url: Valid URL format if provided

**State Transitions**:
- inventory_status can change: in_stock ↔ out_of_stock ↔ low_stock
- is_active: true → false (soft delete), false → true (restore)

### Category Entity  
**Purpose**: Organizes products into hierarchical groupings

**Fields**:
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT - Unique category identifier
- `name`: TEXT NOT NULL UNIQUE - Category display name (max 100 chars)
- `description`: TEXT - Category description (max 500 chars)
- `parent_category_id`: INTEGER - Self-referencing foreign key for hierarchy
- `sort_order`: INTEGER DEFAULT 0 - Display ordering within parent
- `is_active`: BOOLEAN DEFAULT TRUE - Soft delete flag
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

**Validation Rules**:
- name: Required, unique, 1-100 characters
- parent_category_id: Must reference existing category (no circular references)
- sort_order: Non-negative integer

**Relationships**:
- Self-referential: category.parent_category_id → category.id
- One-to-many: category.id → product.category_id

### ProductImage Entity (Future Extension)
**Purpose**: Multiple image support for products

**Fields**:
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `product_id`: INTEGER NOT NULL - Foreign key to Product
- `image_url`: TEXT NOT NULL - Image file URL
- `alt_text`: TEXT - Accessibility description
- `sort_order`: INTEGER DEFAULT 0 - Display order
- `is_primary`: BOOLEAN DEFAULT FALSE - Primary image flag
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

**Note**: Initially implement as single primary_image_url in Product table

## Entity Relationships

```
Category (1) ──── (0..n) Product
    │                      │
    │                      │
    └─ (0..n) Category ────┘
       (self-referential)
```

**Relationship Rules**:
- Products can belong to zero or one category
- Categories can have zero or more products  
- Categories support hierarchical structure (parent/child)
- Deleting category sets product.category_id to NULL
- Soft delete prevents orphaned relationships

## Database Schema (SQLite)

```sql
-- Categories table
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

-- Extended products table (builds on existing)
ALTER TABLE products ADD COLUMN sku TEXT UNIQUE;
ALTER TABLE products ADD COLUMN brand TEXT;
ALTER TABLE products ADD COLUMN category_id INTEGER;
ALTER TABLE products ADD COLUMN inventory_status TEXT NOT NULL DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN inventory_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN weight_grams INTEGER;
ALTER TABLE products ADD COLUMN dimensions_cm TEXT;
ALTER TABLE products ADD COLUMN primary_image_url TEXT;
ALTER TABLE products ADD COLUMN tags TEXT;
ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraint for category
-- Note: SQLite doesn't support ADD CONSTRAINT, so this would be handled in migration
```

## Migration Strategy

### Phase 1: Core Extensions
1. Create categories table
2. Add core product fields (sku, brand, category_id)  
3. Add inventory fields (status, count)
4. Add metadata fields (is_active, updated_at)

### Phase 2: Rich Content
1. Add image and media fields
2. Add physical attribute fields (weight, dimensions)
3. Add flexible categorization (tags)

### Data Migration
- Existing products get default values for new fields
- inventory_status defaults to 'in_stock'
- is_active defaults to TRUE
- No data loss during migration

## Indexing Strategy

**Required Indexes**:
- `products.sku` - Unique constraint and lookup performance
- `products.category_id` - Category filtering performance  
- `products.inventory_status` - Status filtering performance
- `categories.parent_category_id` - Hierarchy traversal performance
- `categories.name` - Category lookup performance

**Composite Indexes** (if performance testing shows need):
- `(category_id, inventory_status)` - Combined filtering
- `(is_active, inventory_status)` - Active product filtering

---

**Status**: ✅ Complete - Ready for contract generation  
**Next**: Generate OpenAPI contracts from entity definitions