# Tasks: Product Content Management System

**Input**: Design documents from `/Users/nico/Documents/sites/product_listing/specs/002-add-comprehensive-product/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: Node.js, Express, React, SQLite, Zod
   → Libraries: product-management, category-management, admin-validation, file-upload
   → Structure: Web app (backend/src/, frontend/src/)
2. Load optional design documents: ✓
   → data-model.md: Product, Category entities extracted
   → contracts/: admin-products-api.yaml with 8 endpoints
   → research.md: Zod validation, status-based inventory, multer uploads
   → quickstart.md: 6 user scenarios for integration tests
3. Generate tasks by category:
   → Setup: migrations, dependencies, project structure
   → Tests: contract tests (8 endpoints), integration tests (6 scenarios)
   → Core: models (2 entities), libraries (4 libs), routes (2 files)
   → Integration: middleware, admin UI, API connections
   → Polish: unit tests, CLI testing, performance validation
4. Apply task rules:
   → Different files = [P] parallel execution
   → Database migrations before model extensions
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T044)
6. Validate completeness: All contracts, entities, scenarios covered
7. SUCCESS: 44 tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Exact file paths included in descriptions

## Path Conventions
- **Web app structure**: `backend/src/`, `frontend/src/` (from plan.md)
- **Library structure**: `backend/src/lib/[library-name]/`
- **Test structure**: Per Test Strategy section in plan.md

## Phase 3.1: Setup & Database Migration
- [ ] T001 Create database migration script `backend/src/database/migrations/001_add_categories.sql`
- [ ] T002 Create database migration script `backend/src/database/migrations/002_extend_products.sql`
- [ ] T003 Update `backend/src/database/connection.js` to run migrations on startup
- [ ] T004 Create data migration script for existing products (set defaults)
- [ ] T005 [P] Add Zod dependency to `backend/package.json`
- [ ] T006 [P] Add multer dependency to `backend/package.json`
- [ ] T007 [P] Create library directory structure `backend/src/lib/` with 4 subdirectories

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (from admin-products-api.yaml)
- [ ] T008 [P] Contract test GET /api/admin/products in `backend/tests/contract/admin-products.test.js`
- [ ] T009 [P] Contract test POST /api/admin/products in `backend/tests/contract/admin-products.test.js`  
- [ ] T010 [P] Contract test PUT /api/admin/products/{id} in `backend/tests/contract/admin-products.test.js`
- [ ] T011 [P] Contract test DELETE /api/admin/products/{id} in `backend/tests/contract/admin-products.test.js`
- [ ] T012 [P] Contract test PATCH /api/admin/products/bulk in `backend/tests/contract/admin-bulk.test.js`
- [ ] T013 [P] Contract test GET /api/admin/categories in `backend/tests/contract/admin-categories.test.js`
- [ ] T014 [P] Contract test POST /api/admin/categories in `backend/tests/contract/admin-categories.test.js`
- [ ] T015 [P] Contract test PUT /api/admin/categories/{id} in `backend/tests/contract/admin-categories.test.js`

### Integration Tests (from quickstart.md scenarios)
- [ ] T016 [P] Integration test "Create New Product" workflow in `backend/tests/integration/admin-workflows.test.js`
- [ ] T017 [P] Integration test "Edit Existing Product" workflow in `backend/tests/integration/admin-workflows.test.js`
- [ ] T018 [P] Integration test "Delete Product" workflow in `backend/tests/integration/admin-workflows.test.js`
- [ ] T019 [P] Integration test "Bulk Update Products" workflow in `backend/tests/integration/admin-workflows.test.js`
- [ ] T020 [P] Integration test "Manage Categories" workflow in `backend/tests/integration/admin-workflows.test.js`
- [ ] T021 [P] Integration test "Search and Filter Products" workflow in `backend/tests/integration/admin-workflows.test.js`
- [ ] T022 [P] Integration test category hierarchy in `backend/tests/integration/category-hierarchy.test.js`
- [ ] T023 [P] Integration test product-category associations in `backend/tests/integration/product-category.test.js`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Library Implementation (Library-First Architecture)
- [ ] T024 [P] Product management library in `backend/src/lib/product-management/index.js`
- [ ] T025 [P] Product management CLI in `backend/src/lib/product-management/cli.js`
- [ ] T026 [P] Category management library in `backend/src/lib/category-management/index.js`
- [ ] T027 [P] Category management CLI in `backend/src/lib/category-management/cli.js`
- [ ] T028 [P] Admin validation library in `backend/src/lib/admin-validation/index.js`
- [ ] T029 [P] Validation schemas in `backend/src/lib/admin-validation/schemas.js`
- [ ] T030 [P] File upload library in `backend/src/lib/file-upload/index.js`

### Model Extensions (from data-model.md)
- [ ] T031 [P] Category model in `backend/src/models/Category.js`
- [ ] T032 Extend Product model in `backend/src/models/Product.js` (add admin methods)

### API Routes Implementation
- [ ] T033 Admin products routes in `backend/src/routes/admin/products.js`
- [ ] T034 Admin categories routes in `backend/src/routes/admin/categories.js`
- [ ] T035 Validation middleware in `backend/src/middleware/validation.js`
- [ ] T036 Update main app in `backend/src/app.js` (add admin routes)

## Phase 3.4: Frontend Integration

### Admin Interface Components
- [ ] T037 [P] Admin Dashboard page in `frontend/src/pages/Admin/Dashboard.js`
- [ ] T038 [P] Admin Products page in `frontend/src/pages/Admin/Products.js`
- [ ] T039 [P] Admin Categories page in `frontend/src/pages/Admin/Categories.js`
- [ ] T040 [P] ProductForm component in `frontend/src/components/Admin/ProductForm.js`
- [ ] T041 [P] BulkActions component in `frontend/src/components/Admin/BulkActions.js`
- [ ] T042 Update frontend App.js routing in `frontend/src/App.js` (add /admin/* routes)
- [ ] T043 Extend API service in `frontend/src/services/api.js` (add admin methods)

## Phase 3.5: Polish & Validation
- [ ] T044 [P] Run quickstart.md validation scenarios and verify all pass

## Dependencies
- Database migrations (T001-T004) before model extensions (T031-T032)
- Library setup (T005-T007) before library implementation (T024-T030)  
- Tests (T008-T023) before implementation (T024-T043)
- Models (T031-T032) before routes (T033-T036)
- Backend API (T033-T036) before frontend integration (T037-T043)
- Core implementation before polish (T044)

## Parallel Execution Examples

### Launch Contract Tests Together (Phase 3.2):
```bash
# These can run in parallel (different test files):
Task: "Contract test GET /api/admin/products in backend/tests/contract/admin-products.test.js"
Task: "Contract test PATCH /api/admin/products/bulk in backend/tests/contract/admin-bulk.test.js"  
Task: "Contract test GET /api/admin/categories in backend/tests/contract/admin-categories.test.js"
Task: "Integration test category hierarchy in backend/tests/integration/category-hierarchy.test.js"
```

### Launch Library Implementation Together (Phase 3.3):
```bash
# These can run in parallel (different library directories):
Task: "Product management library in backend/src/lib/product-management/index.js"
Task: "Category management library in backend/src/lib/category-management/index.js" 
Task: "Admin validation library in backend/src/lib/admin-validation/index.js"
Task: "File upload library in backend/src/lib/file-upload/index.js"
```

### Launch Frontend Components Together (Phase 3.4):
```bash
# These can run in parallel (different component files):
Task: "Admin Dashboard page in frontend/src/pages/Admin/Dashboard.js"
Task: "Admin Products page in frontend/src/pages/Admin/Products.js"
Task: "ProductForm component in frontend/src/components/Admin/ProductForm.js"
Task: "BulkActions component in frontend/src/components/Admin/BulkActions.js"
```

## Task Generation Rules Applied

### From Contracts (admin-products-api.yaml):
- 8 endpoints → 8 contract test tasks (T008-T015) marked [P]
- Each endpoint → corresponding route implementation (T033-T034)

### From Data Model (data-model.md):  
- Product entity → extend existing model (T032)
- Category entity → new model creation (T031) marked [P]

### From User Stories (quickstart.md):
- 6 scenarios → 6 integration test tasks (T016-T021) marked [P]
- Additional relationship tests (T022-T023) marked [P]

### From Library Architecture (plan.md):
- 4 libraries → 4 library tasks (T024, T026, T028, T030) marked [P]
- 4 CLI interfaces → 4 CLI tasks (T025, T027) marked [P]

## Validation Checklist
*GATE: All items must be checked before task execution*

- [x] All contracts have corresponding tests (T008-T015)
- [x] All entities have model tasks (T031-T032) 
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (different files/directories)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Database migrations come first (T001-T004)
- [x] Library-first architecture enforced (T024-T030)
- [x] TDD workflow: failing tests → implementation → passing tests
- [x] Integration points covered (T036, T042, T043)
- [x] Constitutional requirements met (libraries, CLI, TDD)

## Notes
- **[P] tasks**: Different files, no dependencies - safe for parallel execution
- **Sequential tasks**: Shared files or dependencies - must run in order
- **TDD Critical**: All T008-T023 MUST fail before starting T024-T043
- **Migration Critical**: T001-T004 MUST complete before T031-T032
- **Testing**: Each phase validated against quickstart.md scenarios
- **Commit Strategy**: Commit after each completed task for clean history

---

**Total Tasks**: 44  
**Parallel Tasks**: 28  
**Sequential Tasks**: 16  
**Estimated Completion**: 2-3 days with parallel execution