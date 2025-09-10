# Quickstart: Product Listing Integration Tests

**Feature**: Product Listing Page with Filtering and Pagination  
**Date**: 2025-09-09  
**Purpose**: End-to-end user scenarios for integration testing

## Quick Reference Links
- 📋 **Requirements Source**: [spec.md](./spec.md) - Original user stories being tested
- 🏗️ **Data Validation**: [data-model.md](./data-model.md) - Entity behavior being verified
- 📡 **API Contracts**: [contracts/products-api.yaml](./contracts/products-api.yaml) - Backend functionality under test  
- 🗄️ **Test Data**: [database-schema.md](./database-schema.md#testing-data-coverage) - Seed data supporting these scenarios
- 🔧 **Setup Instructions**: [implementation-guide.md](./implementation-guide.md#development-workflow) - How to run these tests

## Test Environment Setup

### Prerequisites
- Node.js 18+ installed
- Backend server running on http://localhost:3001  
- Frontend dev server running on http://localhost:3000
- SQLite database seeded with 150+ products
- Browser: Chrome/Firefox/Safari/Edge (latest versions)

### Test Data Requirements
- Products spanning price range $5-$500
- Product names containing searchable terms ("headphones", "laptop", "phone", etc.)
- Likes distributed across range 0-1000
- At least 6 pages worth of products (150+ items at 25/page)

## Core User Scenarios

### Scenario 1: Basic Product Browsing
**Given**: User visits the product listing page  
**When**: Page loads  
**Then**: 
- [ ] First 25 products are displayed in a grid layout
- [ ] Each product shows name, image, price, and likes count
- [ ] Pagination controls show "Page 1 of N" where N ≥ 6
- [ ] Default sorting is by name (alphabetical ascending)
- [ ] No filters are applied (all products visible)

**Validation Steps**:
1. Navigate to http://localhost:3000
2. Verify 25 product cards are rendered
3. Verify pagination shows correct total pages
4. Verify products are sorted alphabetically
5. Check that all product fields are displayed correctly

### Scenario 2: Price Range Filtering
**Given**: User is viewing the product listing page  
**When**: User sets price filter to $10-$50 range  
**Then**: 
- [ ] Only products within $10-$50 price range are displayed
- [ ] Pagination updates to reflect filtered result count
- [ ] Filter UI shows applied price range
- [ ] Page resets to page 1
- [ ] Applied filters are visible and clearable

**Validation Steps**:
1. Open price filter controls
2. Set minimum price to $10
3. Set maximum price to $50
4. Apply filter and wait for results
5. Verify all displayed products have prices $10-$50
6. Verify pagination recalculated for filtered results
7. Test "Clear Filters" functionality

### Scenario 3: Text Search Functionality
**Given**: User is viewing the product listing page  
**When**: User searches for "headphones"  
**Then**: 
- [ ] Only products with "headphones" in name are displayed
- [ ] Search is case-insensitive
- [ ] Results update after 300ms debounce delay
- [ ] Pagination updates for search results
- [ ] Search term is visible in search input
- [ ] Empty state shown if no matches found

**Validation Steps**:
1. Type "headphones" in search box
2. Wait 300ms for debounce
3. Verify only matching products shown
4. Test case variations ("HEADPHONES", "Headphones")
5. Test no-results scenario with "xyzxyzxyz"
6. Verify empty state message appears
7. Clear search and verify all products return

### Scenario 4: Sorting by Different Criteria
**Given**: User is viewing products with default name sorting  
**When**: User changes sort to "Price: Low to High"  
**Then**: 
- [ ] Products are reordered by price ascending
- [ ] Current page position is maintained if possible
- [ ] Sort dropdown shows selected option
- [ ] All filters remain applied during sort change
- [ ] Product order is visually correct

**Validation Steps**:
1. Note current page and filters
2. Change sort to "Price: Low to High"
3. Verify products are ordered by price (ascending)
4. Change sort to "Price: High to Low"
5. Verify products are ordered by price (descending)
6. Test "Most Liked" sorting option
7. Verify filters are preserved during sort changes

### Scenario 5: Pagination Navigation
**Given**: User is viewing page 1 of product results  
**When**: User clicks "Next" or page number "2"  
**Then**: 
- [ ] Page 2 products are loaded and displayed
- [ ] URL updates to reflect current page
- [ ] Pagination controls update (page 2 active)
- [ ] Previous page controls become enabled
- [ ] Same filters and sorting are maintained
- [ ] Loading state shown during page transition

**Validation Steps**:
1. Start on page 1 with specific filters applied
2. Click "Next" button
3. Verify page 2 content loads correctly
4. Verify URL contains page=2 parameter
5. Click page number "3" directly
6. Verify correct page loads
7. Test "Previous" button functionality
8. Test first/last page edge cases

### Scenario 6: Combined Filtering and Pagination
**Given**: User applies multiple filters (price + search)  
**When**: User sets price $20-$100 AND searches "phone"  
**Then**: 
- [ ] Products match both price range AND name search
- [ ] Pagination reflects intersection of both filters
- [ ] Page resets to 1 when new filters applied
- [ ] Both filter states are visible in UI
- [ ] Results can be sorted while maintaining filters
- [ ] Clear filters removes both conditions

**Validation Steps**:
1. Apply price filter $20-$100
2. Add search term "phone" 
3. Verify products match both conditions
4. Navigate to page 2 of filtered results
5. Apply new sort order
6. Verify filters maintained through sort
7. Clear all filters and verify reset state

## Error Handling Scenarios

### Scenario 7: Network Error Recovery
**Given**: User is browsing products normally  
**When**: Network request fails or times out  
**Then**: 
- [ ] Error message is displayed to user
- [ ] Previous product data remains visible
- [ ] Retry mechanism is available
- [ ] Loading indicators are cleared
- [ ] User can continue using cached data

### Scenario 8: Invalid Filter Inputs
**Given**: User attempts to set invalid price range  
**When**: User sets min price > max price  
**Then**: 
- [ ] Validation error message appears
- [ ] Filter is not applied
- [ ] User can correct the input
- [ ] No API request is made with invalid data
- [ ] Form state is maintained for correction

### Scenario 9: Empty Results Handling
**Given**: User applies very restrictive filters  
**When**: No products match the criteria  
**Then**: 
- [ ] Empty state component is displayed
- [ ] Helpful message explains no results found
- [ ] Clear filters action is prominently available
- [ ] Pagination controls are hidden
- [ ] Filter UI remains functional for adjustments

## Performance Validation

### Load Time Requirements
- [ ] Initial page load < 2 seconds
- [ ] Filter application < 500ms
- [ ] Page navigation < 300ms
- [ ] Search results < 400ms (after debounce)

### Responsive Design Tests
- [ ] Mobile viewport (320px-768px) works correctly
- [ ] Tablet viewport (768px-1024px) works correctly
- [ ] Desktop viewport (1024px+) works correctly
- [ ] Touch interactions work on mobile devices
- [ ] Grid layout adapts to screen size

## Acceptance Criteria Checklist

**Functional Requirements Validation**:
- [ ] FR-001: Products display in grid with name, image, price, likes ✓
- [ ] FR-002: Price range filtering with slider/inputs ✓
- [ ] FR-003: Sorting by price, popularity, likes ✓
- [ ] FR-004: Pagination with 25 items per page ✓
- [ ] FR-005: Text search matching product names ✓
- [ ] FR-006: Loading indicators during operations ✓
- [ ] FR-007: Empty state message for no results ✓
- [ ] FR-008: Session-based preference persistence ✓
- [ ] FR-009: Performance with 150+ products ✓
- [ ] FR-010: Clear filters functionality ✓

**Integration Points Validated**:
- [ ] Frontend ↔ Backend API communication
- [ ] SQLite database query performance
- [ ] CDN image loading reliability
- [ ] Browser state management
- [ ] URL parameter handling

## Manual Test Execution

### Quick Smoke Test (5 minutes)
1. Load page → verify initial state
2. Apply one filter → verify results
3. Navigate to page 2 → verify pagination
4. Clear filters → verify reset

### Full Regression Test (20 minutes)  
Execute all scenarios 1-9 in sequence, documenting any failures or unexpected behaviors for development team review.

### Cross-Browser Testing
Repeat core scenarios (1, 2, 4, 5) across Chrome, Firefox, Safari, and Edge to ensure compatibility.

---
**Test Execution Date**: ___________  
**Executed By**: ___________  
**Environment**: ___________  
**Results**: ___________