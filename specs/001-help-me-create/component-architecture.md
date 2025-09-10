# Component Architecture: React Product Listing

**Feature**: Product Listing Page with Filtering and Pagination  
**Frontend**: React 18+ with CSS Modules  
**Date**: 2025-09-09

## Quick Reference Links
- 🔬 **Technical Decisions**: [research.md](./research.md) - React state management and CSS approach
- 📊 **Data Flow**: [data-model.md](./data-model.md) - Entities managed by components
- 📡 **API Integration**: [contracts/products-api.yaml](./contracts/products-api.yaml) - Backend communication patterns  
- 🔧 **Implementation**: [implementation-guide.md](./implementation-guide.md#phase-3-component-implementation) - Development sequence
- 🧪 **Component Testing**: [quickstart.md](./quickstart.md) - User scenarios validating component behavior

## Component Hierarchy

```
App
└── ProductList (Container)
    ├── FilterPanel
    │   ├── PriceRangeFilter
    │   └── SearchFilter
    ├── SortDropdown
    ├── ProductGrid
    │   └── ProductCard (×25 per page)
    ├── Pagination
    └── UI Components
        ├── LoadingSpinner
        └── EmptyState
```

## Component Specifications

### App.js (Root Component)
**Location**: `frontend/src/App.js`  
**Purpose**: Application shell and global providers

```jsx
// Basic structure - no complex logic
function App() {
  return (
    <div className="App">
      <header>
        <h1>Product Catalog</h1>
      </header>
      <main>
        <FilterProvider>
          <ProductList />
        </FilterProvider>
      </main>
    </div>
  );
}
```

**Responsibilities**:
- Application layout shell
- Global context providers
- Basic styling and branding

**Dependencies**: FilterProvider from context
**Testing**: Basic render test only

---

### ProductList.js (Container Component)
**Location**: `frontend/src/components/ProductList/ProductList.js`  
**Purpose**: Main state orchestrator and layout manager

```jsx
// State management and coordination
function ProductList() {
  // Hooks for data management
  const { products, loading, error, fetchProducts } = useProducts();
  const { filters, updateFilter, clearFilters } = useFilters();
  const { pagination, updatePage } = usePagination();

  // Effects for API calls
  useEffect(() => {
    fetchProducts(filters, pagination);
  }, [filters, pagination.currentPage]);

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <FilterPanel filters={filters} onUpdateFilter={updateFilter} />
        <SortDropdown onSort={updateFilter} />
      </aside>
      <main className={styles.content}>
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage error={error} />}
        {!loading && products.length === 0 && <EmptyState />}
        {!loading && products.length > 0 && (
          <>
            <ProductGrid products={products} />
            <Pagination 
              pagination={pagination} 
              onPageChange={updatePage} 
            />
          </>
        )}
      </main>
    </div>
  );
}
```

**Responsibilities**:
- Coordinate all child components
- Manage API calls through custom hooks
- Handle loading/error/empty states
- Layout: sidebar (filters) + main content

**Props**: None (uses context and hooks)
**State**: Managed through custom hooks
**API Calls**: Via useProducts hook
**CSS**: CSS Modules with responsive grid layout

**References**:
- Uses data entities from [data-model.md](./data-model.md#filter)
- API calls follow [contracts/products-api.yaml](./contracts/products-api.yaml)
- Test scenarios in [quickstart.md](./quickstart.md#scenario-1-basic-product-browsing)

---

### ProductCard.js (Presentation Component)
**Location**: `frontend/src/components/ProductCard/ProductCard.js`  
**Purpose**: Individual product display

```jsx
function ProductCard({ product }) {
  const { id, name, price, likes, imageUrl } = product;
  
  return (
    <article className={styles.card}>
      <img 
        src={imageUrl} 
        alt={name}
        className={styles.image}
        loading="lazy"
      />
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        <div className={styles.price}>${price.toFixed(2)}</div>
        <div className={styles.likes}>
          ❤️ {likes.toLocaleString()} likes
        </div>
      </div>
    </article>
  );
}
```

**Props**:
```typescript
interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    likes: number;
    imageUrl: string;
  }
}
```

**Responsibilities**:
- Display product information
- Handle image loading (lazy loading)
- Format price and likes display
- Responsive card layout

**State**: None (pure presentation)
**CSS**: Card-based design with hover effects
**Testing**: Props validation, formatting, accessibility

**References**:
- Product entity structure from [data-model.md](./data-model.md#product)
- Image URLs from [database-schema.md](./database-schema.md#seed-data-generation)

---

### FilterPanel.js (Complex Form Component)
**Location**: `frontend/src/components/FilterPanel/FilterPanel.js`  
**Purpose**: Container for all filtering controls

```jsx
function FilterPanel({ filters, onUpdateFilter }) {
  return (
    <div className={styles.panel}>
      <h2>Filters</h2>
      
      <PriceRangeFilter 
        min={filters.priceMin}
        max={filters.priceMax}
        onRangeChange={(min, max) => 
          onUpdateFilter({ priceMin: min, priceMax: max })
        }
      />
      
      <SearchFilter 
        value={filters.searchText}
        onChange={(text) => 
          onUpdateFilter({ searchText: text })
        }
      />
      
      <button 
        onClick={() => onUpdateFilter('CLEAR_ALL')}
        className={styles.clearButton}
      >
        Clear All Filters
      </button>
      
      {filters.isActive && (
        <div className={styles.activeIndicator}>
          Filters Applied
        </div>
      )}
    </div>
  );
}
```

**Props**:
```typescript
interface FilterPanelProps {
  filters: FilterState;
  onUpdateFilter: (update: FilterUpdate | 'CLEAR_ALL') => void;
}
```

**Responsibilities**:
- Coordinate filter sub-components
- Manage filter clear functionality  
- Show active filter indicators
- Collapsible on mobile

**References**:
- Filter entity from [data-model.md](./data-model.md#filter-runtime-entity)
- UI decision from [research.md](./research.md#price-filter-ui-decision)

---

### PriceRangeFilter.js (Interactive Input)
**Location**: `frontend/src/components/FilterPanel/PriceRangeFilter.js`  
**Purpose**: Dual-slider price range control

```jsx
function PriceRangeFilter({ min, max, onRangeChange }) {
  const [localMin, setLocalMin] = useState(min || 0);
  const [localMax, setLocalMax] = useState(max || 500);
  const [isValid, setIsValid] = useState(true);
  
  // Debounced update to parent
  const debouncedUpdate = useMemo(
    () => debounce((newMin, newMax) => {
      if (newMin < newMax && newMin >= 0 && newMax <= 500) {
        onRangeChange(newMin, newMax);
        setIsValid(true);
      } else {
        setIsValid(false);
      }
    }, 300),
    [onRangeChange]
  );
  
  return (
    <div className={styles.priceFilter}>
      <label>Price Range</label>
      
      {/* Dual range slider */}
      <div className={styles.sliderContainer}>
        <input
          type="range"
          min="0"
          max="500"
          value={localMin}
          onChange={(e) => {
            setLocalMin(Number(e.target.value));
            debouncedUpdate(Number(e.target.value), localMax);
          }}
          className={styles.rangeMin}
        />
        <input
          type="range"
          min="0"
          max="500"
          value={localMax}
          onChange={(e) => {
            setLocalMax(Number(e.target.value));
            debouncedUpdate(localMin, Number(e.target.value));
          }}
          className={styles.rangeMax}
        />
      </div>
      
      {/* Numeric inputs */}
      <div className={styles.inputs}>
        <input
          type="number"
          value={localMin}
          onChange={(e) => {
            setLocalMin(Number(e.target.value));
            debouncedUpdate(Number(e.target.value), localMax);
          }}
          placeholder="Min"
          className={styles.numberInput}
        />
        <span>to</span>
        <input
          type="number"
          value={localMax}
          onChange={(e) => {
            setLocalMax(Number(e.target.value));
            debouncedUpdate(localMin, Number(e.target.value));
          }}
          placeholder="Max"
          className={styles.numberInput}
        />
      </div>
      
      {!isValid && (
        <div className={styles.error}>
          Invalid price range
        </div>
      )}
    </div>
  );
}
```

**Responsibilities**:
- Dual-slider interface for price range
- Numeric input fallback
- Client-side validation
- Debounced updates to prevent API spam

**State**: Local state for immediate UI feedback
**Validation**: Min < Max, within $0-$500 range
**Performance**: 300ms debounce on API calls

**References**:
- Price validation rules from [data-model.md](./data-model.md#filter-runtime-entity)
- Debounce timing from [research.md](./research.md#performance-strategy)

---

### SearchFilter.js (Debounced Input)
**Location**: `frontend/src/components/FilterPanel/SearchFilter.js`  
**Purpose**: Text search input with debouncing

```jsx
function SearchFilter({ value, onChange }) {
  const [localValue, setLocalValue] = useState(value || '');
  
  // Debounced search to prevent API spam
  const debouncedSearch = useMemo(
    () => debounce((searchText) => {
      onChange(searchText.trim());
    }, 300),
    [onChange]
  );
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSearch(newValue);
  };
  
  const clearSearch = () => {
    setLocalValue('');
    onChange('');
  };
  
  return (
    <div className={styles.searchFilter}>
      <label htmlFor="product-search">Search Products</label>
      <div className={styles.inputContainer}>
        <input
          id="product-search"
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder="Enter product name..."
          className={styles.searchInput}
        />
        {localValue && (
          <button
            onClick={clearSearch}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      <small className={styles.hint}>
        Search updates automatically as you type
      </small>
    </div>
  );
}
```

**Responsibilities**:
- Debounced text input (300ms delay)
- Clear search functionality
- Accessibility features (labels, aria-labels)
- Real-time feedback

**Performance**: 300ms debounce prevents API overload
**UX**: Immediate visual feedback, delayed API call
**Accessibility**: Proper labeling and keyboard navigation

---

### SortDropdown.js (Selection Component)
**Location**: `frontend/src/components/SortDropdown/SortDropdown.js`  
**Purpose**: Product sorting controls

```jsx
function SortDropdown({ currentSort, onSort }) {
  const sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' },
    { value: 'name_desc', label: 'Name (Z-A)', field: 'name', direction: 'desc' },
    { value: 'price_asc', label: 'Price (Low to High)', field: 'price', direction: 'asc' },
    { value: 'price_desc', label: 'Price (High to Low)', field: 'price', direction: 'desc' },
    { value: 'likes_desc', label: 'Most Liked', field: 'likes', direction: 'desc' },
    { value: 'likes_asc', label: 'Least Liked', field: 'likes', direction: 'asc' }
  ];
  
  const handleSortChange = (e) => {
    const option = sortOptions.find(opt => opt.value === e.target.value);
    onSort({
      sortBy: option.field,
      sortOrder: option.direction
    });
  };
  
  return (
    <div className={styles.sortDropdown}>
      <label htmlFor="sort-select">Sort by</label>
      <select
        id="sort-select"
        value={`${currentSort.field}_${currentSort.direction}`}
        onChange={handleSortChange}
        className={styles.select}
      >
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

**Responsibilities**:
- Dropdown with sort options
- Convert selection to API format
- Clear visual indication of current sort

**Options**: Name, price, likes (ascending/descending)
**State**: Controlled by parent component

**References**:
- Sort criteria from [data-model.md](./data-model.md#sortcriteria-runtime-entity)
- API parameters from [contracts/products-api.yaml](./contracts/products-api.yaml)

---

### Pagination.js (Navigation Component)
**Location**: `frontend/src/components/Pagination/Pagination.js`  
**Purpose**: Page navigation controls

```jsx
function Pagination({ pagination, onPageChange }) {
  const { currentPage, totalPages, itemsPerPage, totalItems } = pagination;
  
  // Generate page numbers (show current ±2 pages)
  const getVisiblePages = () => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  
  const visiblePages = getVisiblePages();
  
  return (
    <nav className={styles.pagination} aria-label="Product pagination">
      <div className={styles.info}>
        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products
      </div>
      
      <div className={styles.controls}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={styles.navButton}
          aria-label="Previous page"
        >
          ← Previous
        </button>
        
        {visiblePages[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className={styles.pageButton}>1</button>
            {visiblePages[0] > 2 && <span className={styles.ellipsis}>...</span>}
          </>
        )}
        
        {visiblePages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`${styles.pageButton} ${page === currentPage ? styles.current : ''}`}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && <span className={styles.ellipsis}>...</span>}
            <button onClick={() => onPageChange(totalPages)} className={styles.pageButton}>{totalPages}</button>
          </>
        )}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={styles.navButton}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}
```

**Responsibilities**:
- Page navigation (prev/next/direct)
- Item count display
- Smart page number display (ellipsis for large page counts)
- Accessibility compliance

**UX**: Shows current ±2 pages, ellipsis for gaps
**Accessibility**: ARIA labels, proper navigation semantics
**Performance**: Only renders necessary page buttons

---

## Custom Hooks

### useProducts.js
**Location**: `frontend/src/hooks/useProducts.js`  
**Purpose**: Products data fetching and caching

```jsx
function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchProducts = useCallback(async (filters, pagination) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await productsService.getProducts({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      });
      
      setProducts(response.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { products, loading, error, fetchProducts };
}
```

### useFilters.js  
**Location**: `frontend/src/hooks/useFilters.js`  
**Purpose**: Filter state management

```jsx
function useFilters() {
  const [filters, setFilters] = useState({
    priceMin: null,
    priceMax: null,
    searchText: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  const updateFilter = useCallback((update) => {
    if (update === 'CLEAR_ALL') {
      setFilters({
        priceMin: null,
        priceMax: null,
        searchText: '',
        sortBy: 'name',
        sortOrder: 'asc'
      });
    } else {
      setFilters(prev => ({ ...prev, ...update }));
    }
  }, []);
  
  return { filters, updateFilter };
}
```

### usePagination.js
**Location**: `frontend/src/hooks/usePagination.js`  
**Purpose**: Pagination state management

```jsx
function usePagination() {
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 25,
    totalItems: 0,
    totalPages: 0
  });
  
  const updatePage = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  }, []);
  
  return { pagination, updatePage, setPagination };
}
```

## Context Management

### FilterContext.js
**Location**: `frontend/src/context/FilterContext.js`  
**Purpose**: Global filter state sharing

```jsx
const FilterContext = createContext();

export function FilterProvider({ children }) {
  const filterHook = useFilters();
  const paginationHook = usePagination();
  
  return (
    <FilterContext.Provider value={{ ...filterHook, ...paginationHook }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within FilterProvider');
  }
  return context;
};
```

## CSS Architecture

### CSS Modules Structure
Each component has its own `.module.css` file:

```
src/components/
├── ProductList/ProductList.module.css
├── ProductCard/ProductCard.module.css  
├── FilterPanel/FilterPanel.module.css
├── SortDropdown/SortDropdown.module.css
└── Pagination/Pagination.module.css
```

### Responsive Design
- **Mobile**: Stacked layout, collapsible filters
- **Tablet**: 2-column grid, sidebar filters  
- **Desktop**: 3-4 column grid, permanent sidebar

### CSS Custom Properties
```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --color-success: #059669;
  --color-error: #dc2626;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

## Testing Strategy

### Component Tests
- **ProductCard**: Props validation, formatting, accessibility
- **FilterPanel**: User interactions, validation, state updates
- **Pagination**: Navigation logic, edge cases (first/last page)

### Hook Tests  
- **useProducts**: API calls, loading states, error handling
- **useFilters**: State updates, clear functionality
- **usePagination**: Page calculations, boundary conditions

### Integration Tests
- **Filter → API**: Verify filter parameters are passed correctly
- **Sort → API**: Verify sort parameters are translated properly  
- **Page → API**: Verify pagination parameters work correctly

**References**:
- Test scenarios from [quickstart.md](./quickstart.md)
- API validation from [contracts/products-api.yaml](./contracts/products-api.yaml)
- Implementation sequence from [implementation-guide.md](./implementation-guide.md)

## Performance Optimizations

### React Optimization
- **useMemo**: Expensive calculations (page number arrays)
- **useCallback**: Stable function references for child components
- **React.memo**: Pure components (ProductCard)
- **Lazy loading**: Images with loading="lazy"

### Bundle Optimization
- **Code splitting**: Dynamic imports for non-critical components
- **Tree shaking**: Import only used utilities
- **CSS purging**: Remove unused styles in production

### Runtime Performance
- **Debouncing**: 300ms for search and price inputs
- **Virtualization**: For very large product lists (future enhancement)
- **Caching**: Browser cache for API responses

This component architecture supports the complete feature requirements while maintaining the constitutional principles of simplicity, testability, and performance.