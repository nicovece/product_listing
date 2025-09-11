# Quickstart: Product Content Management System

**Date**: 2025-09-10  
**Feature**: 002-add-comprehensive-product  
**Purpose**: Integration test scenarios for validating admin product management functionality

## Prerequisites
- Development server running on http://localhost:3001
- SQLite database initialized with categories and products tables
- Admin frontend accessible at http://localhost:3000/admin

## Test Scenarios

### Scenario 1: Create New Product
**User Story**: Admin creates a new product with complete information

**Steps**:
1. Navigate to `/admin/products`
2. Click "Add New Product" button
3. Fill out product form:
   - Name: "Wireless Bluetooth Headphones"
   - Description: "High-quality wireless headphones with noise cancellation"
   - SKU: "WBH-001"
   - Brand: "TechCorp"
   - Price: $99.99 (9999 cents)
   - Category: "Electronics"
   - Inventory Status: "In Stock"
   - Inventory Count: 50
   - Weight: 250g
4. Click "Save Product"

**Expected Results**:
- Product appears in admin product list
- Product is immediately visible in customer product listing
- Success message: "Product created successfully"
- Product ID assigned and returned

**API Validation**:
```bash
# Create product via API
curl -X POST http://localhost:3001/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Bluetooth Headphones",
    "description": "High-quality wireless headphones with noise cancellation",
    "sku": "WBH-001",
    "brand": "TechCorp",
    "price": 9999,
    "inventory_status": "in_stock",
    "inventory_count": 50,
    "weight_grams": 250
  }'

# Expected response: 201 Created with product object
```

### Scenario 2: Edit Existing Product
**User Story**: Admin updates product price and inventory status

**Steps**:
1. Navigate to `/admin/products`
2. Click "Edit" on existing product
3. Update fields:
   - Price: Change to $89.99 (8999 cents)  
   - Inventory Status: Change to "Low Stock"
   - Inventory Count: Change to 5
4. Click "Update Product"

**Expected Results**:
- Product updates saved immediately
- Price change reflected in customer listing
- Status indicator updated in admin list
- Success message: "Product updated successfully"

**API Validation**:
```bash
# Update product via API
curl -X PUT http://localhost:3001/api/admin/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 8999,
    "inventory_status": "low_stock",
    "inventory_count": 5
  }'

# Expected response: 200 OK with updated product object
```

### Scenario 3: Delete Product
**User Story**: Admin removes discontinued product from catalog

**Steps**:
1. Navigate to `/admin/products`
2. Click "Delete" on target product
3. Confirm deletion in confirmation dialog
4. Click "Yes, Delete"

**Expected Results**:
- Product removed from admin list
- Product no longer visible in customer listing
- Success message: "Product deleted successfully"
- Product soft-deleted (is_active = false) in database

**API Validation**:
```bash
# Delete product via API
curl -X DELETE http://localhost:3001/api/admin/products/1

# Expected response: 204 No Content
# Verify product not in customer API
curl http://localhost:3001/api/products
# Product should not appear in results
```

### Scenario 4: Bulk Update Products
**User Story**: Admin changes category for multiple products simultaneously

**Steps**:
1. Navigate to `/admin/products`
2. Select multiple products using checkboxes
3. Click "Bulk Actions" dropdown
4. Select "Change Category"
5. Choose new category: "Electronics > Accessories"
6. Click "Apply to Selected"

**Expected Results**:
- All selected products moved to new category
- Category filter shows products in correct category
- Success message: "Updated 5 products successfully"
- No partial failures

**API Validation**:
```bash
# Bulk update products via API
curl -X PATCH http://localhost:3001/api/admin/products/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "product_ids": [1, 2, 3, 4, 5],
    "updates": {
      "category_id": 2
    }
  }'

# Expected response: 200 OK with updated_count: 5
```

### Scenario 5: Manage Categories
**User Story**: Admin creates new category and organizes products

**Steps**:
1. Navigate to `/admin/categories`
2. Click "Add Category"
3. Fill out form:
   - Name: "Smart Devices"
   - Description: "Internet-connected devices and gadgets"
   - Parent Category: "Electronics"
4. Click "Save Category"
5. Navigate back to products
6. Edit product and assign to new category

**Expected Results**:
- Category appears in categories list
- Category available in product category dropdown
- Products can be assigned to new category
- Category hierarchy displayed correctly

**API Validation**:
```bash
# Create category via API
curl -X POST http://localhost:3001/api/admin/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smart Devices",
    "description": "Internet-connected devices and gadgets",
    "parent_category_id": 1
  }'

# Expected response: 201 Created with category object
```

### Scenario 6: Search and Filter Products
**User Story**: Admin searches for specific products and filters by status

**Steps**:
1. Navigate to `/admin/products`
2. Enter "bluetooth" in search box
3. Press Enter or click Search
4. Apply filter: Status = "In Stock"
5. Apply filter: Category = "Electronics"

**Expected Results**:
- Product list filtered to matching items only
- Search term highlighted in results
- Filter badges show active filters
- Pagination works with filtered results
- Clear filters option available

**API Validation**:
```bash
# Search and filter via API
curl "http://localhost:3001/api/admin/products?search=bluetooth&status=in_stock&category=1"

# Expected response: 200 OK with filtered product list
```

## Error Handling Scenarios

### Invalid Data Validation
**Test**: Submit product with invalid data
- Empty product name
- Negative price
- Invalid SKU format
- Non-existent category ID

**Expected**: 400 Bad Request with detailed validation errors

### Duplicate SKU Handling  
**Test**: Create product with existing SKU
**Expected**: 400 Bad Request with "SKU already exists" error

### Bulk Operation Failures
**Test**: Bulk update with some invalid product IDs
**Expected**: 200 OK with failed_items array listing errors

## Performance Requirements

### Response Time Targets
- Product list (25 items): < 200ms
- Create/update product: < 100ms
- Bulk operations (10 items): < 500ms
- Search results: < 300ms

### Concurrent Usage
- 5 admin users performing operations simultaneously
- No data corruption or race conditions
- Consistent inventory counts

## Integration Points

### Database Consistency
- Changes immediately visible across admin and customer APIs
- Foreign key constraints enforced
- Transaction rollback on errors

### Frontend-Backend Sync
- Optimistic updates with error rollback
- Real-time status indicators
- Proper loading states during operations

---

**Validation Checklist**:
- [ ] All API endpoints respond correctly
- [ ] Frontend properly handles all user interactions
- [ ] Data validation works on both client and server
- [ ] Error messages are clear and actionable
- [ ] Performance targets met
- [ ] No data loss during bulk operations
- [ ] Category relationships maintained
- [ ] Inventory status changes reflected immediately

**Next Phase**: Task generation for TDD implementation