# Implementation Guide: Product Listing Page

**Feature**: Product Listing Page with Filtering and Pagination  
**Branch**: `001-help-me-create`  
**Date**: 2025-09-09

## Quick Reference Links
- 📋 **Specification**: [spec.md](./spec.md) - Business requirements and user stories
- 🔬 **Research Decisions**: [research.md](./research.md) - Technical choices and rationale  
- 🏗️ **Data Model**: [data-model.md](./data-model.md) - Entities and validation rules
- 📡 **API Contract**: [contracts/products-api.yaml](./contracts/products-api.yaml) - OpenAPI specification
- 🧪 **Test Scenarios**: [quickstart.md](./quickstart.md) - Integration test workflows
- 🏛️ **Component Structure**: [component-architecture.md](./component-architecture.md) - React architecture
- 🗄️ **Database Setup**: [database-schema.md](./database-schema.md) - SQL schema and seed data

## Project Structure

Create this exact directory structure from repository root:

```
product_listing/
├── backend/
│   ├── package.json                 # Node.js dependencies (Express, better-sqlite3)
│   ├── src/
│   │   ├── app.js                   # Express app setup and middleware
│   │   ├── database/
│   │   │   ├── connection.js        # SQLite connection management
│   │   │   ├── schema.sql           # Database schema (see database-schema.md)
│   │   │   └── seed.js              # Seed data generation
│   │   ├── routes/
│   │   │   └── products.js          # GET /api/products endpoint
│   │   ├── models/
│   │   │   └── Product.js           # Product data access layer
│   │   └── utils/
│   │       ├── validation.js        # Request parameter validation
│   │       └── errors.js            # Error handling utilities
│   ├── tests/
│   │   ├── contract/
│   │   │   └── products-api.test.js # API contract tests
│   │   ├── integration/
│   │   │   └── products-flow.test.js # End-to-end API tests
│   │   └── unit/
│   │       ├── models/
│   │       └── routes/
│   └── products.db                  # SQLite database file (generated)
│
├── frontend/
│   ├── package.json                 # React dependencies
│   ├── public/
│   │   └── index.html               # HTML shell
│   ├── src/
│   │   ├── index.js                 # React app entry point
│   │   ├── App.js                   # Root component with routing
│   │   ├── components/
│   │   │   ├── ProductList/         # Main container component
│   │   │   │   ├── ProductList.js   # State management and orchestration
│   │   │   │   └── ProductList.module.css
│   │   │   ├── ProductCard/         # Individual product display
│   │   │   │   ├── ProductCard.js
│   │   │   │   └── ProductCard.module.css
│   │   │   ├── FilterPanel/         # Price/search filters
│   │   │   │   ├── FilterPanel.js
│   │   │   │   ├── FilterPanel.module.css
│   │   │   │   ├── PriceRangeFilter.js
│   │   │   │   └── SearchFilter.js
│   │   │   ├── SortDropdown/        # Sorting controls
│   │   │   │   ├── SortDropdown.js
│   │   │   │   └── SortDropdown.module.css
│   │   │   ├── Pagination/          # Page navigation
│   │   │   │   ├── Pagination.js
│   │   │   │   └── Pagination.module.css
│   │   │   └── UI/                  # Reusable UI components
│   │   │       ├── LoadingSpinner.js
│   │   │       ├── EmptyState.js
│   │   │       └── Button.js
│   │   ├── hooks/
│   │   │   ├── useProducts.js       # Products data fetching
│   │   │   ├── useFilters.js        # Filter state management
│   │   │   └── usePagination.js     # Pagination logic
│   │   ├── services/
│   │   │   ├── api.js               # API client (fetch wrapper)
│   │   │   └── productsService.js   # Products API calls
│   │   ├── context/
│   │   │   └── FilterContext.js     # Global filter state
│   │   └── utils/
│   │       ├── debounce.js          # Search input debouncing
│   │       └── validation.js        # Client-side validation
│   └── tests/
│       ├── components/              # Component unit tests
│       ├── hooks/                   # Custom hook tests
│       ├── integration/             # Frontend integration tests
│       └── e2e/                     # End-to-end browser tests
│
└── docs/
    └── api/                         # Generated API documentation
```

## Implementation Sequence

Follow this exact order for TDD compliance and dependency management:

### Phase 1: Backend Foundation (Days 1-2)

#### Step 1.1: Project Setup
```bash
# From repository root
mkdir -p backend frontend
cd backend
npm init -y
npm install express better-sqlite3 cors dotenv
npm install --save-dev jest supertest nodemon
```

#### Step 1.2: Database Layer
1. **Create schema**: `backend/src/database/schema.sql` (see [database-schema.md](./database-schema.md))
2. **Setup connection**: `backend/src/database/connection.js` with better-sqlite3
3. **Create seed script**: `backend/src/database/seed.js` with 150 dummy products
4. **Initialize database**: Run seed script to create products.db

**Reference**: Data model fields and validation rules in [data-model.md](./data-model.md#product)

#### Step 1.3: API Contract Tests (RED phase)
1. **Create contract test**: `backend/tests/contract/products-api.test.js`
2. **Test all endpoints** from [contracts/products-api.yaml](./contracts/products-api.yaml)
3. **Verify tests FAIL** (no implementation yet)

**Key tests from contract**:
- GET /api/products returns 200 with product array
- Filtering by priceMin/priceMax works correctly  
- Sorting by name/price/likes functions
- Pagination with page/limit parameters
- Error responses for invalid parameters

#### Step 1.4: API Implementation (GREEN phase)
1. **Product model**: `backend/src/models/Product.js` with database queries
2. **Products route**: `backend/src/routes/products.js` implementing contract
3. **Express app**: `backend/src/app.js` with middleware and routes
4. **Validation utils**: `backend/src/utils/validation.js` for query params
5. **Run tests**: Verify contract tests now PASS

**Reference**: API specification in [contracts/products-api.yaml](./contracts/products-api.yaml)

### Phase 2: Frontend Foundation (Days 3-4)

#### Step 2.1: React Setup
```bash
cd ../frontend
npx create-react-app . --template minimal
npm install --save-dev @testing-library/jest-dom
```

#### Step 2.2: API Service Layer
1. **API client**: `frontend/src/services/api.js` with fetch wrapper
2. **Products service**: `frontend/src/services/productsService.js`
3. **Service tests**: Test API calls with mocked responses

**Reference**: Use endpoint patterns from [contracts/products-api.yaml](./contracts/products-api.yaml)

#### Step 2.3: Custom Hooks (TDD)
1. **Write hook tests first**: `frontend/tests/hooks/useProducts.test.js`
2. **Create useProducts hook**: Handle loading, error, and data states
3. **Create useFilters hook**: Manage filter state and API integration  
4. **Create usePagination hook**: Handle page navigation logic

**Reference**: State requirements from [data-model.md](./data-model.md#filter)

### Phase 3: Component Implementation (Days 5-6)

#### Step 3.1: Core Components (TDD)
1. **ProductCard tests**: `frontend/tests/components/ProductCard.test.js`
2. **ProductCard component**: Display name, image, price, likes
3. **LoadingSpinner**: Simple loading indicator
4. **EmptyState**: No results message

**Reference**: Component structure in [component-architecture.md](./component-architecture.md)

#### Step 3.2: Filter Components  
1. **FilterPanel tests**: Test price range and search functionality
2. **PriceRangeFilter**: Dual slider + numeric inputs (see [research.md](./research.md#price-filter-ui-decision))
3. **SearchFilter**: Debounced text input (300ms delay)
4. **SortDropdown**: Price/name/likes sorting options

#### Step 3.3: Layout Components
1. **Pagination tests**: Test page navigation logic
2. **Pagination component**: Previous/next buttons + page numbers
3. **ProductList**: Main container orchestrating all components

### Phase 4: Integration (Days 7-8)

#### Step 4.1: Frontend-Backend Integration
1. **Start both servers**: Backend on :3001, frontend on :3000
2. **Integration tests**: Full user workflows from [quickstart.md](./quickstart.md)
3. **Cross-origin setup**: Configure CORS for local development

#### Step 4.2: End-to-End Testing
1. **Execute test scenarios**: All 9 scenarios from [quickstart.md](./quickstart.md#core-user-scenarios)
2. **Performance validation**: Load times and response times
3. **Cross-browser testing**: Chrome, Firefox, Safari, Edge

### Phase 5: Polish and Documentation (Day 9)

#### Step 5.1: Error Handling
1. **Network errors**: Retry logic and user feedback
2. **Validation errors**: Form validation and error messages  
3. **Loading states**: Smooth transitions and skeleton screens

#### Step 5.2: Documentation
1. **README.md**: Setup and running instructions
2. **API documentation**: Generate from OpenAPI spec
3. **Component documentation**: PropTypes and usage examples

## Development Commands

Add these scripts to respective package.json files:

### Backend (`backend/package.json`)
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "seed": "node src/database/seed.js",
    "reset-db": "rm -f products.db && npm run seed"
  }
}
```

### Frontend (`frontend/package.json`)
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build", 
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false"
  }
}
```

## Environment Configuration

### Backend Environment (`.env`)
```
PORT=3001
NODE_ENV=development
DB_PATH=./products.db
CORS_ORIGIN=http://localhost:3000
```

### Frontend Environment (`.env`)
```
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

## Development Workflow

### Daily Development Process
1. **Start backend**: `cd backend && npm run dev`
2. **Start frontend**: `cd frontend && npm start` (separate terminal)
3. **Run tests**: Keep test watchers running during development
4. **Commit frequently**: After each GREEN phase in TDD cycle

### TDD Cycle for Each Feature
1. **RED**: Write failing test first
2. **GREEN**: Implement minimal code to pass
3. **REFACTOR**: Clean up code while keeping tests green
4. **COMMIT**: Save progress with descriptive message

### Integration Testing Schedule
- **After each component**: Test component isolation
- **After each hook**: Test state management logic  
- **After API changes**: Run contract tests
- **End of each day**: Run full quickstart scenarios

## Troubleshooting

### Common Setup Issues
- **Port conflicts**: Change ports in .env files
- **CORS errors**: Verify backend CORS configuration
- **Database lock**: Stop backend before resetting database
- **Module resolution**: Ensure imports use correct relative paths

### Performance Monitoring
- **API response time**: Should be <500ms for filtering
- **Initial page load**: Should be <2s
- **Memory usage**: Monitor for React state leaks
- **Bundle size**: Keep under 1MB for production build

## Ready to Start

Once this structure is created, begin with **Phase 1, Step 1.1** above. Each step references specific design decisions and implementation details from the linked documentation files.

The implementation sequence ensures constitutional compliance (TDD, library-first architecture) while building incrementally from database → API → frontend → integration.