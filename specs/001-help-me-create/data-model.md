# Data Model: Product Listing System

**Feature**: Product Listing Page with Filtering and Pagination  
**Date**: 2025-09-09  
**Source**: Extracted from feature specification requirements

## Quick Reference Links
- 📋 **Business Requirements**: [spec.md](./spec.md) - User stories that define these entities
- 🔬 **Research Decisions**: [research.md](./research.md) - Technical choices affecting data structure
- 📡 **API Implementation**: [contracts/products-api.yaml](./contracts/products-api.yaml) - How entities are exposed via API
- 🗄️ **Database Schema**: [database-schema.md](./database-schema.md) - SQL implementation of these models
- 🧪 **Test Coverage**: [quickstart.md](./quickstart.md) - User scenarios validating entity behavior

## Core Entities

### Product
**Purpose**: Represents a catalog item with basic information for listing and filtering

**Fields**:
- `id` (integer, primary key): Unique product identifier
- `name` (string, required): Product display name for search and display
- `price` (decimal, required): Product price in dollars for filtering and sorting
- `likes` (integer, default 0): Number of user likes for sorting by popularity
- `imageUrl` (string, required): CDN URL for placeholder product image

**Validation Rules**:
- `name`: 1-255 characters, non-empty string
- `price`: Positive decimal, 0.01-9999.99 range
- `likes`: Non-negative integer, 0-999999 range  
- `imageUrl`: Valid URL format, HTTPS required

**Indexing Requirements**:
- Primary index on `id`
- Secondary index on `price` (for range filtering)
- Secondary index on `likes` (for popularity sorting)
- Full-text index on `name` (for search functionality)

### Filter (Runtime Entity)
**Purpose**: Represents user's current filtering criteria, maintained in frontend state

**Fields**:
- `priceMin` (decimal, optional): Minimum price filter bound
- `priceMax` (decimal, optional): Maximum price filter bound  
- `searchText` (string, optional): Text search query for product names
- `isActive` (boolean): Whether any filters are currently applied

**Validation Rules**:
- `priceMin`: If set, must be ≥ 0 and ≤ priceMax
- `priceMax`: If set, must be > priceMin and ≤ 9999.99
- `searchText`: 0-100 characters, trimmed of whitespace

### SortCriteria (Runtime Entity)  
**Purpose**: Represents user's selected sorting preferences

**Fields**:
- `field` (enum): Sorting field - "price" | "likes" | "name"
- `direction` (enum): Sort direction - "asc" | "desc"

**Validation Rules**:
- `field`: Must be one of the allowed enum values
- `direction`: Must be "asc" or "desc"

**Default Values**:
- `field`: "name" 
- `direction`: "asc"

### PaginationState (Runtime Entity)
**Purpose**: Tracks pagination position and configuration

**Fields**:
- `currentPage` (integer): Current page number, 1-based
- `itemsPerPage` (integer): Items shown per page
- `totalItems` (integer): Total number of items matching current filters
- `totalPages` (integer): Total pages for current result set

**Validation Rules**:
- `currentPage`: Must be ≥ 1 and ≤ totalPages
- `itemsPerPage`: Fixed at 25 for this implementation
- `totalItems`: Non-negative integer
- `totalPages`: Calculated as ceil(totalItems / itemsPerPage)

## Relationships

### Product Entity Relationships
- **No relationships**: Products are independent entities
- **Future extensibility**: Could relate to Category, Brand entities in v2

### Runtime Entity Relationships  
- **Filter → Product**: Many-to-many via query (filters select products)
- **SortCriteria → Product**: One-to-many via ordering (sorts product results)
- **PaginationState → Product**: One-to-many via offset/limit (pages through products)

## State Transitions

### Filter State Transitions
```
Empty → Filtered: User applies price/search filter
Filtered → Modified: User changes existing filter values  
Filtered → Empty: User clears all filters
Modified → Applied: Debounce timeout triggers new search
```

### Pagination State Transitions
```
Page N → Page N+1: User clicks Next or page number
Page N → Page 1: User applies new filter (reset to first page)
Any Page → Recalculated: Total items change due to filtering
```

### Sort State Transitions
```
Default → Custom: User selects different sort option
Custom → Modified: User changes sort field or direction
Any Sort → Reset: User clears filters (return to default)
```

## Data Persistence

### Backend Persistence (SQLite)
- **Products table**: Persistent, seeded with dummy data
- **Database file**: `products.db` in backend root
- **Migration strategy**: Schema versioning for future changes

### Frontend Persistence (Browser Memory)
- **Filter state**: React useState, session-only
- **Sort state**: React useState, session-only  
- **Pagination state**: React useState, session-only
- **Products cache**: React useState, cleared on filter change

## API Integration

### Query Translation
- **Frontend Filter** → **Backend SQL WHERE clause**
- **Frontend Sort** → **Backend SQL ORDER BY clause**  
- **Frontend Pagination** → **Backend SQL LIMIT/OFFSET clause**

### Request/Response Format
- **Request**: Query parameters in GET /api/products
- **Response**: JSON with products array + pagination metadata
- **Error handling**: Standard HTTP status codes + error messages

## Sample Data Structure

### Product Record
Implementation in [database-schema.md](./database-schema.md#products-table)
```json
{
  "id": 1,
  "name": "Wireless Bluetooth Headphones",  
  "price": 89.99,
  "likes": 245,
  "imageUrl": "https://picsum.photos/300/300?random=1"
}
```

### API Response
Full schema definition in [contracts/products-api.yaml](./contracts/products-api.yaml#components-schemas-productlistresponse)
```json
{
  "products": [...],
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 25, 
    "totalItems": 150,
    "totalPages": 6
  },
  "appliedFilters": {
    "priceMin": 20.00,
    "priceMax": 100.00,
    "searchText": "headphones"
  }
}
```

**Next Steps**: See [implementation-guide.md](./implementation-guide.md) for complete development workflow using these data models.