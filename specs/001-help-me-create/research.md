# Research: Product Listing Page Implementation

**Feature**: Product Listing Page with Filtering and Pagination  
**Date**: 2025-09-09  
**Scope**: Technical research to resolve NEEDS CLARIFICATION items

## Quick Reference Links
- 📋 **Business Requirements**: [spec.md](./spec.md) - User stories and functional requirements
- 🏗️ **Implementation Plan**: [plan.md](./plan.md) - Updated with research findings  
- 📊 **Data Model**: [data-model.md](./data-model.md) - Entities informed by these decisions
- 🗄️ **Database Setup**: [database-schema.md](./database-schema.md) - SQLite schema and seed data
- 🔧 **Implementation Guide**: [implementation-guide.md](./implementation-guide.md) - Step-by-step development workflow

## Research Findings

### Testing Framework Decision
**Decision**: Jest + React Testing Library  
**Rationale**: Industry standard for React applications, excellent React component testing support, good integration with modern build tools  
**Alternatives considered**: Vitest (faster but newer ecosystem), Cypress (E2E focus, overkill for component testing)

### Database Size and Scale Decision  
**Decision**: 100-200 dummy products for demonstration  
**Rationale**: Enough to demonstrate pagination effectively (4-8 pages at 25 items/page), test filtering edge cases, show performance patterns without overwhelming initial load  
**Alternatives considered**: 1000+ products (unnecessary complexity for demo), <50 products (insufficient for pagination testing)

### Items Per Page Decision
**Decision**: 25 products per page  
**Rationale**: Balances user experience (not overwhelming, good scroll depth) with technical efficiency (reasonable API payload size, clear pagination UX)  
**Alternatives considered**: 10/page (too many page clicks), 50/page (overwhelming grid, slow loading)

### Price Filter UI Decision
**Decision**: Dual range slider with numeric inputs  
**Rationale**: Intuitive visual control, precise numeric entry option, common pattern in e-commerce  
**Alternatives considered**: Predefined ranges only (less flexible), separate min/max inputs (less visual)

### Session Persistence Decision
**Decision**: Session-only persistence (browser memory)  
**Rationale**: Simpler implementation, appropriate for demo/prototype phase, avoids localStorage complexity  
**Alternatives considered**: localStorage (persists across sessions but adds complexity), no persistence (poor UX)

### SQLite Integration Approach
**Decision**: Node.js backend with better-sqlite3 + Express API  
**Rationale**: Better-sqlite3 is synchronous and fast, Express provides minimal REST API, separates concerns cleanly  
**Alternatives considered**: In-browser SQLite (sql.js - large bundle, complex), direct file access (security issues)

### Image CDN Selection  
**Decision**: Picsum Photos (picsum.photos)  
**Rationale**: Free, no authentication required, parameterized URLs for consistent sizing, reliable service  
**Alternatives considered**: Unsplash API (requires authentication), Lorem Picsum alternatives (less reliable), placeholder.com (less realistic images)

### React State Management Decision
**Decision**: useState + useContext for global filters, local state for pagination  
**Rationale**: Minimal dependencies requirement, adequate for feature scope, React built-ins sufficient  
**Alternatives considered**: Redux (overkill for this scope), Zustand (external dependency), useReducer (unnecessary complexity)

### CSS Approach Decision
**Decision**: CSS Modules with vanilla CSS  
**Rationale**: Scoped styling without external dependencies, works well with React, maintainable  
**Alternatives considered**: Styled-components (external dependency), Tailwind CSS (external dependency), Plain CSS (global scope issues)

## Technical Architecture Decisions

### Component Architecture
- **Container Pattern**: ProductList manages all state, pure presentation components below
- **Prop Drilling**: Acceptable for this scope, avoids context complexity
- **Reusable Components**: ProductCard, FilterPanel, Pagination designed for reuse

### API Design Pattern
- **RESTful Endpoints**: GET /api/products with query parameters for filters/pagination
- **Single Endpoint Strategy**: One products endpoint handles all filtering/sorting/pagination
- **Response Format**: JSON with products array and metadata (totalCount, currentPage, etc.)

### Database Schema
- **Simple Flat Structure**: Single products table with id, name, price, likes, imageUrl
- **No Relationships**: Appropriate for demo scope, can expand later
- **Indexed Fields**: price and likes for efficient sorting/filtering

### Performance Strategy
- **Backend Filtering**: Database handles filter logic, not frontend
- **Debounced Search**: 300ms delay to reduce API calls during typing
- **Optimistic UI**: Show loading states, maintain pagination position

## Implementation Notes

### Development Workflow
1. **Backend API first** (contract-driven development) - See [database-schema.md](./database-schema.md)
2. **Database setup with seed data** - Automated via [database-schema.md](./database-schema.md#seed-data-generation)
3. **Frontend components with mock data** - Structure in [component-architecture.md](./component-architecture.md)
4. **Integration and testing** - Test scenarios from [quickstart.md](./quickstart.md)
5. **UI polish and edge cases** - Complete workflow in [implementation-guide.md](./implementation-guide.md)

### Testing Strategy
- **Contract Tests**: API endpoint behavior and response schemas
- **Integration Tests**: Full user workflows (filter → sort → paginate)
- **Component Tests**: Individual React component behavior
- **E2E Scenarios**: Critical user paths from quickstart.md

### Deployment Considerations
- **Development**: Node.js backend + React dev server
- **Production**: Static React build served by Express, SQLite file included
- **Database**: Included in repository as committed file for demo purposes

## Open Questions Resolved
- ✅ Testing framework: Jest + React Testing Library
- ✅ Database size: 100-200 products
- ✅ Items per page: 25 products
- ✅ Price filter UI: Dual range slider + inputs
- ✅ Session persistence: Memory only
- ✅ SQLite integration: Node.js backend with better-sqlite3

All NEEDS CLARIFICATION items from Technical Context have been researched and resolved.