import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ProductList from './components/ProductList/ProductList';
import FilterPanel from './components/FilterPanel/FilterPanel';
import LoadingSpinner from './components/UI/LoadingSpinner';
import EmptyState from './components/UI/EmptyState';
import { fetchProducts } from './services/api';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/Products';
import AdminCategories from './pages/Admin/Categories';

import './App.css';

// Main product catalog component
function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    search: '',
    priceMin: '',
    priceMax: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts(filters);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to load products. Please make sure the backend server is running.');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1
    }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 25,
      search: '',
      priceMin: '',
      priceMax: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }, []);

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>Product Catalog</h1>
          <p>Browse our collection with filtering and sorting</p>
        </div>
        <nav className="header-nav">
          <Link to="/admin" className="admin-link">
            Admin Dashboard
          </Link>
        </nav>
      </header>
      
      <main className="app-main">
        <div className="sidebar">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>
        
        <div className="content">
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={loadProducts}>Retry</button>
            </div>
          )}
          
          {loading && <LoadingSpinner />}
          
          {!loading && !error && products.length === 0 && (
            <EmptyState onClearFilters={handleClearFilters} />
          )}
          
          {!loading && !error && products.length > 0 && (
            <>
              {pagination && (
                <div className="results-info">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} products
                </div>
              )}
              
              <ProductList
                products={products}
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Admin layout component
function AdminLayout({ children }) {
  const location = useLocation();
  
  const isActiveRoute = (path) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    if (path !== '/admin' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-content">
          <Link to="/" className="home-link">
            ← Back to Catalog
          </Link>
          <h1>Admin Panel</h1>
        </div>
      </header>
      
      <nav className="admin-nav">
        <Link 
          to="/admin" 
          className={`nav-link ${isActiveRoute('/admin') ? 'active' : ''}`}
        >
          📊 Dashboard
        </Link>
        <Link 
          to="/admin/products" 
          className={`nav-link ${isActiveRoute('/admin/products') ? 'active' : ''}`}
        >
          📦 Products
        </Link>
        <Link 
          to="/admin/categories" 
          className={`nav-link ${isActiveRoute('/admin/categories') ? 'active' : ''}`}
        >
          📁 Categories
        </Link>
      </nav>
      
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<ProductCatalog />} />
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        } />
        
        <Route path="/admin/products" element={
          <AdminLayout>
            <AdminProducts />
          </AdminLayout>
        } />
        
        <Route path="/admin/categories" element={
          <AdminLayout>
            <AdminCategories />
          </AdminLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;