import React, { useState, useEffect, useCallback } from 'react';
import ProductList from './components/ProductList/ProductList';
import FilterPanel from './components/FilterPanel/FilterPanel';
import LoadingSpinner from './components/UI/LoadingSpinner';
import EmptyState from './components/UI/EmptyState';
import { fetchProducts } from './services/api';
import './App.css';

function App() {
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

export default App;