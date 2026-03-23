# Product Listing Application

A full-stack product catalog with admin dashboard, built with React and Node.js. Features real-time search, filtering, sorting, pagination, and a complete inventory management system.

**Live demo:** [product-listing-shy-fog-6441.fly.dev](https://product-listing-shy-fog-6441.fly.dev/)

## Features

### Public Catalog
- Real-time search with 300ms debounce
- Price range filtering with validation
- Sort by name, price, or likes (ascending/descending)
- Pagination (25 items per page)
- Responsive grid layout with lazy-loaded images
- Loading states, empty states, and error handling with retry

### Admin Dashboard
- Product CRUD with bulk operations (update/delete)
- Category management with parent/child hierarchy
- Inventory tracking (in stock, low stock, out of stock)
- Low-stock alerts and inventory statistics
- Product image upload
- Advanced search and filtering

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** with better-sqlite3 (WAL mode, migrations, indexing)
- **Zod** for request validation
- Input sanitization and rate limiting on admin endpoints

### Frontend
- **React 18** with hooks and functional components
- **Vite** for dev server and builds
- **React Router** for client-side routing
- **CSS Modules** for scoped styling
- **Vitest** + Testing Library for component tests (25 tests)

### Deployment
- **Fly.io** with persistent volume for SQLite
- Multi-stage Docker build (frontend build + backend production)
- Auto-seeding on first deploy

## Project Structure

```
product_listing/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express server
│   │   ├── start.js               # Production entry point
│   │   ├── database/              # Schema, migrations, seed, connection
│   │   ├── models/                # Product and Category models
│   │   ├── routes/                # Public and admin API routes
│   │   ├── middleware/            # Validation and security
│   │   └── lib/                   # Business logic modules
│   └── products.db                # SQLite database (180 sample products)
├── frontend/
│   ├── src/
│   │   ├── components/            # ProductCard, ProductList, FilterPanel, Pagination
│   │   ├── pages/Admin/           # Dashboard, Products, Categories
│   │   ├── services/api.js        # API client
│   │   └── test/                  # Test setup
│   └── vite.config.js
├── Dockerfile
└── fly.toml
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm

### Installation

```bash
git clone https://github.com/nicovece/product_listing.git
cd product_listing
```

**Backend** (terminal 1):
```bash
cd backend
pnpm install
pnpm run seed    # first time only
pnpm dev
```

**Frontend** (terminal 2):
```bash
cd frontend
pnpm install
pnpm dev
```

Open http://localhost:3000. Admin dashboard at http://localhost:3000/admin.

### Running Tests

```bash
cd frontend
pnpm test
```

## API

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (supports `search`, `priceMin`, `priceMax`, `sortBy`, `sortOrder`, `page`, `limit`) |
| GET | `/health` | Health check |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/products` | List all products |
| POST | `/api/admin/products` | Create product |
| GET | `/api/admin/products/:id` | Get product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Soft delete product |
| PATCH | `/api/admin/products/bulk` | Bulk update |
| DELETE | `/api/admin/products/bulk` | Bulk delete |
| GET | `/api/admin/products/stats/inventory` | Inventory statistics |
| GET | `/api/admin/products/low-stock` | Low stock alerts |
| GET | `/api/admin/categories` | List categories |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category |

## License

MIT
