# Tasks: Product Listing Page with Filtering and Pagination

**Input**: Design documents from `/Users/nico/Documents/sites/product_listing/specs/001-help-me-create/`
**Prerequisites**: plan.md (✓), data-model.md (✓), contracts/products-api.yaml (✓), research.md (✓), quickstart.md (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extract: React 18+, Node.js/Express, SQLite, Jest + React Testing Library
   → Structure: Web app (backend + frontend)
2. Load design documents ✓
   → data-model.md: Product entity, Filter/Sort/Pagination states
   → contracts/: products-api.yaml → GET /api/products endpoint
   → quickstart.md: 9 integration test scenarios  
3. Generate tasks by category ✓
4. Apply TDD rules: Tests before implementation ✓
5. Number tasks sequentially (T001-T030) ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions (Web App Structure)
- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`

---

## Phase 3.1: Setup & Infrastructure

### T001: Create Project Structure
Create directory structure per implementation-guide.md specifications:
```
backend/
├── package.json
├── src/ (database/, routes/, models/, utils/)
└── tests/ (contract/, integration/, unit/)
frontend/
├── package.json  
├── src/ (components/, hooks/, services/, context/, utils/)
└── tests/ (components/, hooks/, integration/, e2e/)
```
**File**: Repository root directories
**Dependencies**: None

### T002: Initialize Backend Project
Create `backend/package.json` with Express, better-sqlite3, Jest, supertest dependencies per technical context
**File**: `backend/package.json`
**Dependencies**: T001

### T003: [P] Initialize Frontend Project  
Create `frontend/package.json` with React 18+, Jest, React Testing Library dependencies per technical context
**File**: `frontend/package.json`  
**Dependencies**: T001

### T004: [P] Configure Backend Linting
Set up ESLint and Prettier for Node.js/Express codebase
**Files**: `backend/.eslintrc.js`, `backend/.prettierrc`
**Dependencies**: T002

### T005: [P] Configure Frontend Linting
Set up ESLint and Prettier for React codebase  
**Files**: `frontend/.eslintrc.js`, `frontend/.prettierrc`
**Dependencies**: T003

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

### T006: [P] Database Schema Test
Create failing test for SQLite database schema creation and seed data per database-schema.md
**File**: `backend/tests/unit/database.test.js`
**Test Data**: 150+ products with price range $5-$500, realistic likes distribution
**Dependencies**: T002

### T007: [P] Products API Contract Test
Create failing test for GET /api/products endpoint per contracts/products-api.yaml schema validation
**File**: `backend/tests/contract/products-api.test.js`
**Validates**: Query parameters, response schema, error handling per OpenAPI spec
**Dependencies**: T002

### T008: [P] Basic Product Browsing Integration Test
Create failing test for quickstart.md Scenario 1: Initial page load shows 25 products, pagination, default sort
**File**: `backend/tests/integration/basic-browsing.test.js`
**Scenario**: User visits page → 25 products displayed → pagination shows correct pages
**Dependencies**: T002

### T009: [P] Price Range Filtering Integration Test
Create failing test for quickstart.md Scenario 2: Price filter $10-$50 → filtered results → pagination updates
**File**: `backend/tests/integration/price-filtering.test.js`
**Scenario**: Apply price range → only matching products → page resets to 1
**Dependencies**: T002

### T010: [P] Text Search Integration Test  
Create failing test for quickstart.md Scenario 3: Search "headphones" → case-insensitive matching → debounced API calls
**File**: `backend/tests/integration/text-search.test.js`
**Scenario**: Type search term → 300ms delay → matching products only
**Dependencies**: T002

### T011: [P] Sorting Integration Test
Create failing test for quickstart.md Scenario 4: Sort by price/name/likes → products reordered → filters preserved
**File**: `backend/tests/integration/sorting.test.js`
**Scenario**: Change sort option → products reorder → current page/filters maintained
**Dependencies**: T002

### T012: [P] Pagination Integration Test
Create failing test for quickstart.md Scenario 5: Navigate pages → URL updates → content changes → controls update
**File**: `backend/tests/integration/pagination.test.js`
**Scenario**: Click page 2 → new products load → pagination state updates
**Dependencies**: T002

### T013: [P] Combined Filtering Integration Test
Create failing test for quickstart.md Scenario 6: Price + search filters → intersection results → sorting works
**File**: `backend/tests/integration/combined-filtering.test.js`
**Scenario**: Multiple filters → AND logic → sort/page still functional
**Dependencies**: T002

### T014: [P] ProductCard Component Test
Create failing test for React ProductCard component per component-architecture.md specifications
**File**: `frontend/tests/components/ProductCard.test.js`
**Tests**: Props validation, price formatting, image loading, accessibility
**Dependencies**: T003

### T015: [P] FilterPanel Component Test  
Create failing test for FilterPanel with PriceRangeFilter + SearchFilter per component specifications
**File**: `frontend/tests/components/FilterPanel.test.js`
**Tests**: User interactions, validation, debounced updates, clear functionality
**Dependencies**: T003

### T016: [P] Pagination Component Test
Create failing test for Pagination component per component-architecture.md with ellipsis logic and accessibility
**File**: `frontend/tests/components/Pagination.test.js`
**Tests**: Page navigation, disabled states, ARIA labels, edge cases
**Dependencies**: T003

### T017: [P] Custom Hooks Test
Create failing tests for useProducts, useFilters, usePagination hooks per component-architecture.md
**File**: `frontend/tests/hooks/hooks.test.js`
**Tests**: State management, API integration, error handling
**Dependencies**: T003

---

## Phase 3.3: Core Implementation (Backend First)

### T018: Database Connection Setup
Implement SQLite database connection using better-sqlite3 per database-schema.md specifications
**File**: `backend/src/database/connection.js`
**Features**: WAL mode, foreign keys, graceful shutdown
**Tests**: Must pass T006
**Dependencies**: T006

### T019: Database Schema Implementation
Implement products table schema creation with indexes per database-schema.md SQL definitions
**File**: `backend/src/database/schema.sql`
**Schema**: Products table with validation constraints, performance indexes
**Tests**: Must pass T006
**Dependencies**: T006, T018

### T020: Database Seed Data Generator
Implement seed data generation script per database-schema.md with 180 realistic products
**File**: `backend/src/database/seed.js`
**Data**: Price distribution $5-$500, likes 0-2000, searchable names, Picsum URLs
**Tests**: Must pass T006
**Dependencies**: T006, T018, T019

### T021: Product Model Implementation
Implement Product data access layer with SQLite queries per data-model.md validation rules
**File**: `backend/src/models/Product.js`
**Methods**: findAll, findByFilters, count (for pagination), with proper SQL injection protection
**Tests**: Must pass T007, T008-T013
**Dependencies**: T007, T018-T020

### T022: Products API Route Implementation
Implement GET /api/products endpoint per contracts/products-api.yaml with full query parameter support
**File**: `backend/src/routes/products.js`
**Features**: Filtering, sorting, pagination, error handling, query validation
**Tests**: Must pass T007-T013
**Dependencies**: T007-T013, T021

### T023: Express App Configuration  
Implement Express application setup with middleware, CORS, error handling per research.md decisions
**File**: `backend/src/app.js`
**Features**: JSON parsing, CORS for localhost:3000, structured error responses
**Tests**: Must pass T007-T013
**Dependencies**: T007-T013, T022

---

## Phase 3.4: Core Implementation (Frontend)

### T024: [P] API Service Layer
Implement frontend API client and products service per component-architecture.md service specifications
**File**: `frontend/src/services/productsService.js`
**Features**: Fetch wrapper, error handling, query parameter building
**Dependencies**: T003

### T025: [P] Custom Hooks Implementation
Implement useProducts, useFilters, usePagination hooks per component-architecture.md specifications  
**Files**: `frontend/src/hooks/useProducts.js`, `frontend/src/hooks/useFilters.js`, `frontend/src/hooks/usePagination.js`
**Features**: State management, API integration, debouncing
**Tests**: Must pass T017
**Dependencies**: T017, T024

### T026: ProductCard Component Implementation
Implement ProductCard component per component-architecture.md with lazy loading and accessibility
**Files**: `frontend/src/components/ProductCard/ProductCard.js`, `ProductCard.module.css`
**Features**: Product display, price formatting, image lazy loading
**Tests**: Must pass T014
**Dependencies**: T014

### T027: FilterPanel Components Implementation
Implement FilterPanel, PriceRangeFilter, SearchFilter per component-architecture.md with debouncing
**Files**: `frontend/src/components/FilterPanel/FilterPanel.js`, `PriceRangeFilter.js`, `SearchFilter.js`, `FilterPanel.module.css`
**Features**: Dual range slider, debounced search, validation, clear filters
**Tests**: Must pass T015
**Dependencies**: T015, T025

### T028: Pagination Component Implementation  
Implement Pagination component per component-architecture.md with smart ellipsis and accessibility
**Files**: `frontend/src/components/Pagination/Pagination.js`, `Pagination.module.css`
**Features**: Page navigation, ellipsis logic, ARIA labels, item count display
**Tests**: Must pass T016
**Dependencies**: T016

### T029: ProductList Container Implementation
Implement main ProductList container component orchestrating all child components per component-architecture.md
**Files**: `frontend/src/components/ProductList/ProductList.js`, `ProductList.module.css`
**Features**: State coordination, API calls, loading/error states, responsive layout
**Dependencies**: T025-T028

### T030: App Component and Context Setup
Implement root App component with FilterProvider context per component-architecture.md
**Files**: `frontend/src/App.js`, `frontend/src/context/FilterContext.js`, `frontend/src/index.js`
**Features**: Application shell, global context, router setup
**Dependencies**: T025, T029

---

## Phase 3.5: Integration & Testing

### T031: [P] Backend Development Server Setup
Configure backend development server with hot reload and database reset commands
**Files**: Update `backend/package.json` scripts section
**Scripts**: dev, test:watch, reset-db, seed
**Dependencies**: T018-T023

### T032: [P] Frontend Development Server Setup  
Configure frontend development server with React dev server and proxy setup
**Files**: Update `frontend/package.json` scripts, add proxy configuration  
**Scripts**: start, test, build, test:coverage
**Dependencies**: T024-T030

### T033: Cross-Origin Configuration
Configure CORS between frontend (localhost:3000) and backend (localhost:3001) per research.md
**Files**: Update `backend/src/app.js` CORS configuration
**Features**: Allow credentials, specific origins, preflight handling
**Dependencies**: T023, T032

### T034: End-to-End Integration Testing
Run all quickstart.md scenarios (1-6) with both servers running to validate complete user workflows
**Test Environment**: Backend on :3001, frontend on :3000, seeded database
**Scenarios**: All 6 user scenarios from quickstart.md must pass
**Dependencies**: T031-T033

---

## Phase 3.6: Polish & Performance

### T035: [P] Error Handling Polish
Implement comprehensive error handling with user-friendly messages and proper HTTP status codes
**Files**: `backend/src/utils/errors.js`, `frontend/src/components/ErrorBoundary.js`
**Features**: Structured error responses, user feedback, retry mechanisms
**Dependencies**: T023, T030

### T036: [P] Loading States & UX Polish
Implement smooth loading states, skeleton screens, and transitions per research.md performance goals
**Files**: `frontend/src/components/UI/LoadingSpinner.js`, `EmptyState.js`
**Features**: Loading indicators, empty states, smooth transitions
**Dependencies**: T030

### T037: [P] Performance Optimization
Implement React performance optimizations (useMemo, useCallback, React.memo) per component-architecture.md
**Files**: Update frontend component files with performance optimizations
**Features**: Memoization, stable references, bundle optimization
**Dependencies**: T025-T030

### T038: [P] Accessibility Compliance
Ensure WCAG compliance with proper ARIA labels, keyboard navigation, and screen reader support
**Files**: Update all frontend component files with accessibility features
**Features**: ARIA labels, keyboard navigation, focus management, semantic HTML
**Dependencies**: T026-T030

### T039: [P] Mobile Responsiveness
Implement responsive design with mobile-first CSS per component-architecture.md responsive strategy
**Files**: Update all `.module.css` files with responsive breakpoints
**Features**: Mobile layout, touch interactions, adaptive grid
**Dependencies**: T026-T030

### T040: Performance Validation
Validate performance goals: <2s initial load, <500ms filter responses per technical context
**Tools**: Lighthouse, browser dev tools, API response monitoring
**Metrics**: Core Web Vitals, API response times, bundle size analysis  
**Dependencies**: T034-T039

---

## Parallel Execution Examples

### Backend Setup Phase (Can run simultaneously):
```bash
# Terminal 1: Database setup
Task T006 T018 T019 T020

# Terminal 2: API tests  
Task T007 T008 T009 T010 T011 T012 T013
```

### Frontend Components (Can run simultaneously):
```bash  
# Terminal 1: Core components
Task T014 T026

# Terminal 2: Filter components  
Task T015 T027

# Terminal 3: Navigation components
Task T016 T028

# Terminal 4: Hooks and services
Task T017 T025 T024
```

### Polish Phase (Can run simultaneously):
```bash
# Terminal 1: Error handling
Task T035

# Terminal 2: Performance  
Task T037 T040

# Terminal 3: UX polish
Task T036 T039

# Terminal 4: Accessibility
Task T038
```

## Dependency Graph

**Critical Path**: T001 → T002 → T006 → T018 → T019 → T020 → T021 → T022 → T023 → T031 → T033 → T034

**Parallel Branches**:
- Frontend: T001 → T003 → T014-T017 → T024-T030 → T032
- Testing: T002/T003 → T006-T017 (all test tasks can run in parallel)
- Polish: T034 → T035-T040 (all polish tasks can run in parallel)

## Task Validation Checklist

- [x] All contracts have tests: products-api.yaml → T007 ✓
- [x] All entities have models: Product → T021 ✓  
- [x] All endpoints implemented: GET /api/products → T022 ✓
- [x] All user scenarios tested: 6 scenarios → T008-T013 ✓
- [x] All components tested: ProductCard, FilterPanel, Pagination → T014-T016 ✓
- [x] TDD order enforced: Tests (T006-T017) before implementation (T018+) ✓
- [x] Constitutional compliance: Library structure, CLI interfaces, real dependencies ✓

**Total Tasks**: 40 tasks across 5 phases
**Estimated Timeline**: 8-10 days with parallel execution
**Critical Dependencies**: Database → API → Frontend → Integration → Polish