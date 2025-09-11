# Implementation Plan: Product Content Management System

**Branch**: `002-add-comprehensive-product` | **Date**: 2025-09-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/nico/Documents/sites/product_listing/specs/002-add-comprehensive-product/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Add comprehensive product content management system for administrators to create, edit, delete, and manage product catalog including product details, categories, pricing, inventory status, and bulk operations. Building on existing React frontend with Node.js/Express backend and SQLite database, extending with REST API endpoints for CRUD operations, server-side validation, and admin interface routes.

## Technical Context
**Language/Version**: Node.js (existing), React 18+ (existing), TypeScript  
**Primary Dependencies**: Express (existing), better-sqlite3 (existing), React, joi/zod for validation, multer for file uploads  
**Storage**: SQLite database (existing) with better-sqlite3 driver  
**Testing**: Jest + React Testing Library (existing)  
**Target Platform**: Web application (cross-platform browser support)
**Project Type**: web - determines source structure (frontend + backend)  
**Performance Goals**: Standard web app performance, <2s page loads, responsive UI  
**Constraints**: No user authentication required for this phase, lightweight solution  
**Scale/Scope**: 100-200 products (existing), admin management interface, CRUD operations

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (backend API, frontend admin interface) - within limit
- Using framework directly? Yes (Express, React without wrapper abstractions)
- Single data model? Yes (entities used across API and UI without DTOs)
- Avoiding patterns? Yes (direct database access, no Repository pattern)

**Architecture**:
- EVERY feature as library? Yes - product management lib, category management lib, validation lib
- Libraries listed: 
  - product-management: CRUD operations and business logic
  - category-management: Category hierarchy and organization
  - admin-validation: Zod schemas and validation logic  
  - file-upload: Image handling utilities
- CLI per library: Yes (--help, --version, --format JSON support)
- Library docs: llms.txt format planned for each library

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes (contract tests written first, must fail)
- Git commits show tests before implementation? Yes (TDD workflow mandatory)
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual SQLite database, not mocks)
- Integration tests for: new admin API contracts, schema changes, bulk operations
- FORBIDDEN: Implementation before test, skipping RED phase - strictly enforced

**Observability**:
- Structured logging included? Yes (admin operations, bulk changes, errors)
- Frontend logs → backend? Yes (admin action logging, error tracking)
- Error context sufficient? Yes (validation details, operation context)

**Versioning**:
- Version number assigned? Yes (1.0.0 for content management feature)
- BUILD increments on every change? Yes (automated versioning)
- Breaking changes handled? Yes (database migrations, API versioning)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 - Web application (frontend + backend detected in Technical Context)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs AND audit improvements below
- Use Database Migration Strategy section for migration tasks (T001-T005)
- Use Library Architecture Details for library creation tasks
- Use Integration Points for file modification tasks  
- Use File-Specific Task Mapping for contract → implementation tasks
- Use Test Strategy section for specific test file creation
- Each contract → contract test task [P] (from contracts/)
- Each entity → model creation task [P] (from data-model.md)
- Each user story → integration test task (from quickstart.md)
- Each library → CLI interface task (from Library Architecture Details)

**Ordering Strategy**:
- TDD order: Tests before implementation (Constitutional requirement)
- Database migrations before model extensions
- Libraries before route implementations  
- Models before services before UI components
- Mark [P] for parallel execution (different files, no dependencies)
- Reference Integration Points section for dependency mapping

**File Path Strategy**:
- Use exact paths from Integration Points section
- Backend tasks reference `backend/src/` structure
- Frontend tasks reference `frontend/src/` structure  
- Library tasks follow `backend/src/lib/` structure
- Test tasks follow Test Strategy file structure

**Estimated Output**: 35-45 numbered, ordered tasks in tasks.md (increased due to migration and library tasks)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Database Migration Strategy
*Added from implementation audit - CRITICAL for task generation*

### Schema Evolution Plan
**Current Schema** (backend/src/database/schema.sql):
```sql
products (id, name, price, likes, imageUrl, created_at, updated_at)
```

**Target Schema** (from data-model.md):
```sql
-- Categories table (NEW)
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

-- Extended products table
ALTER TABLE products ADD COLUMN sku TEXT UNIQUE;
ALTER TABLE products ADD COLUMN brand TEXT;
ALTER TABLE products ADD COLUMN description TEXT;
ALTER TABLE products ADD COLUMN category_id INTEGER;
ALTER TABLE products ADD COLUMN inventory_status TEXT NOT NULL DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN inventory_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN weight_grams INTEGER;
ALTER TABLE products ADD COLUMN dimensions_cm TEXT;
ALTER TABLE products ADD COLUMN primary_image_url TEXT;
ALTER TABLE products ADD COLUMN tags TEXT;
ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
```

### Migration Task Sequence
1. **T001**: Create migration script `backend/src/database/migrations/001_add_categories.sql`
2. **T002**: Create migration script `backend/src/database/migrations/002_extend_products.sql`
3. **T003**: Update connection.js to run migrations on startup
4. **T004**: Create data migration for existing products (set defaults)
5. **T005**: Create rollback scripts for development

### Data Preservation Strategy
- Existing products maintain all current fields
- New fields get sensible defaults (inventory_status: 'in_stock', is_active: true)
- imageUrl field maps to primary_image_url
- No data loss during migration

## Library Architecture Details
*Added from implementation audit - Constitutional requirement*

### Library Structure
```
backend/src/lib/
├── product-management/
│   ├── index.js              # Exports: createProduct, updateProduct, deleteProduct, findProducts
│   ├── cli.js                # CLI: --create-product, --update-product, --bulk-update
│   ├── product-service.js    # Business logic layer
│   └── validation.js         # Zod schemas for products
├── category-management/
│   ├── index.js              # Exports: createCategory, updateCategory, deleteCategory, findCategories
│   ├── cli.js                # CLI: --create-category, --list-categories --tree-view
│   ├── category-service.js   # Hierarchy logic, validation
│   └── validation.js         # Zod schemas for categories
├── admin-validation/
│   ├── index.js              # Exports validation middleware
│   ├── schemas.js            # All Zod schemas
│   ├── middleware.js         # Express validation middleware
│   └── cli.js                # CLI: --validate-data, --check-constraints
└── file-upload/
    ├── index.js              # Exports: uploadImage, deleteImage, resizeImage
    ├── cli.js                # CLI: --upload-image, --cleanup-images
    ├── upload-service.js     # Multer configuration, file handling
    └── validation.js         # File validation rules
```

### Library Integration with Existing Code
- Libraries extend existing `backend/src/models/Product.js`
- Database connection shared via `backend/src/database/connection.js`
- Express app imports library routes in `backend/src/app.js`
- Each library includes CLI interface for testing and management

### CLI Interface Specifications
**Product Management CLI**:
```bash
node src/lib/product-management/cli.js --create-product --name "Test Product" --price 1999 --format json
node src/lib/product-management/cli.js --bulk-update --file products.json --dry-run
node src/lib/product-management/cli.js --help
```

**Category Management CLI**:
```bash
node src/lib/category-management/cli.js --create-category --name "Electronics" --description "Electronic devices"
node src/lib/category-management/cli.js --tree-view --format json
```

## Integration Points with Existing Code
*Added from implementation audit - Missing implementation bridges*

### Backend Integration
**Existing files to modify**:
- `backend/src/app.js`: Add admin routes (`app.use('/api/admin', adminRoutes)`)
- `backend/src/models/Product.js`: Extend with admin methods (create, update, delete, bulk operations)
- `backend/package.json`: Add dependencies (zod, multer, joi as fallback)

**New files to create**:
- `backend/src/routes/admin/products.js`: Admin CRUD endpoints
- `backend/src/routes/admin/categories.js`: Category management endpoints  
- `backend/src/models/Category.js`: Category model with hierarchy support
- `backend/src/middleware/validation.js`: Request validation middleware

### Frontend Integration
**Existing files to modify**:
- `frontend/src/App.js`: Add admin routing (`/admin/*` routes)
- `frontend/src/services/api.js`: Add admin API methods
- `frontend/package.json`: Add dependencies if needed

**New files to create**:
- `frontend/src/pages/Admin/Dashboard.js`: Main admin interface
- `frontend/src/pages/Admin/Products.js`: Product management page
- `frontend/src/pages/Admin/Categories.js`: Category management page
- `frontend/src/components/Admin/ProductForm.js`: Product create/edit form
- `frontend/src/components/Admin/BulkActions.js`: Bulk operations component

### Shared Integration
- Database connection: Reuse `backend/src/database/connection.js`
- Error handling: Extend existing patterns in `backend/src/routes/products.js`
- Styling: Reuse existing CSS patterns from customer interface

## File-Specific Task Mapping
*Added from implementation audit - Contract to implementation mapping*

### Contract → Implementation Mapping
**From `contracts/admin-products-api.yaml`**:

| Contract Endpoint | Implementation File | Dependencies |
|-------------------|-------------------|--------------|
| `GET /api/admin/products` | `backend/src/routes/admin/products.js` | Extended Product.js model |
| `POST /api/admin/products` | Same file + validation middleware | Zod schemas, Category.js |
| `PUT /api/admin/products/{id}` | Same file | Product.findById, validation |
| `DELETE /api/admin/products/{id}` | Same file | Soft delete logic |
| `PATCH /api/admin/products/bulk` | Same file | Bulk operation service |
| `GET /api/admin/categories` | `backend/src/routes/admin/categories.js` | Category.js model |
| `POST /api/admin/categories` | Same file | Category validation, hierarchy |

### Frontend Page → API Integration
| Frontend Component | API Endpoints Used | State Management |
|--------------------|-------------------|------------------|
| `Admin/Products.js` | GET, POST, PUT, DELETE `/api/admin/products` | Local state + React hooks |
| `Admin/Categories.js` | GET, POST, PUT, DELETE `/api/admin/categories` | Category hierarchy state |
| `Admin/ProductForm.js` | POST/PUT products, GET categories | Form state, validation |
| `Admin/BulkActions.js` | PATCH `/api/admin/products/bulk` | Selection state, operation status |

## Test Strategy and File Structure
*Added from implementation audit - Specific test implementation details*

### Test File Structure
```
backend/tests/
├── contract/
│   ├── admin-products.test.js      # Contract tests for product endpoints
│   ├── admin-categories.test.js    # Contract tests for category endpoints
│   └── admin-bulk.test.js          # Contract tests for bulk operations
├── integration/
│   ├── admin-workflows.test.js     # End-to-end admin scenarios
│   ├── category-hierarchy.test.js  # Category parent/child relationships  
│   └── product-category.test.js    # Product-category associations
├── unit/
│   ├── product-service.test.js     # Product management library tests
│   ├── category-service.test.js    # Category management library tests
│   ├── validation.test.js          # Zod schema validation tests
│   └── file-upload.test.js         # Image upload utility tests
└── lib/
    ├── product-management-cli.test.js  # CLI interface tests
    └── category-management-cli.test.js # CLI interface tests

frontend/tests/
├── components/admin/
│   ├── ProductForm.test.js         # Product create/edit form tests
│   ├── CategoryForm.test.js        # Category management tests
│   ├── BulkActions.test.js         # Bulk operations component tests
│   └── AdminDashboard.test.js      # Main admin interface tests
├── pages/
│   ├── AdminProducts.test.js       # Product management page tests
│   └── AdminCategories.test.js     # Category management page tests
└── integration/
    └── admin-workflows.test.js     # Full admin user journey tests
```

### Database Setup for Tests
**Test Database Strategy**:
- Use separate SQLite database for tests (`:memory:` for speed)
- Reset database state between test suites
- Seed with known test data for consistent results
- Migration tests run against temporary database files

### TDD Implementation Strategy
**Phase Order (Constitutional Requirement)**:
1. **Contract Tests First**: Write failing tests for API endpoints
2. **Integration Tests**: Write failing tests for user workflows  
3. **Implementation**: Make tests pass with minimal code
4. **Unit Tests**: Add detailed validation and edge case tests
5. **Refactor**: Clean up implementation while keeping tests green

**Parallel Development Support**:
- Contract tests can run in parallel (different endpoints)
- Frontend and backend tests independent (different databases)
- Library CLI tests isolated (separate from integration tests)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md created
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md created  
- [x] Phase 2: Task planning complete (/plan command - approach described below)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS - library architecture confirmed
- [x] Post-Design Constitution Check: PASS - no violations, TDD approach validated
- [x] All NEEDS CLARIFICATION resolved - research.md addresses all unknowns
- [x] Complexity deviations documented - none required, simple approach

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*