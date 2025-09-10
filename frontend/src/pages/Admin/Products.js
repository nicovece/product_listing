import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import ProductForm from '../../components/Admin/ProductForm';
import BulkActions from '../../components/Admin/BulkActions';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    search: '',
    category: '',
    status: '',
    sort_by: 'name',
    sort_order: 'asc'
  });

  useEffect(() => {
    // Parse URL parameters
    const searchParams = new URLSearchParams(location.search);
    const urlFilters = {
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || 25,
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      status: searchParams.get('status') || '',
      sort_by: searchParams.get('sort_by') || 'name',
      sort_order: searchParams.get('sort_order') || 'asc'
    };
    
    setFilters(urlFilters);
  }, [location.search]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [filters]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.products.list(filters);
      setProducts(response.data || []);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await adminAPI.categories.list();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }, []);

  const updateUrlParams = (newFilters) => {
    const searchParams = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        searchParams.set(key, value);
      }
    });

    const newSearch = searchParams.toString();
    navigate(`/admin/products${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value, page: 1 };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const handlePageChange = (page) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const handleProductSelect = (productId, selected) => {
    if (selected) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleFormSubmit = (product) => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts(); // Reload to show updated data
    setSelectedProducts([]); // Clear selection
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await adminAPI.products.delete(productId);
      loadProducts();
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
    }
  };

  const handleBulkAction = (actionData) => {
    loadProducts(); // Reload products after bulk action
    setSelectedProducts([]); // Clear selection
    
    // Show success message
    const { action, result } = actionData;
    const count = result.updated_count || result.deleted_count || 0;
    const actionName = action === 'delete' ? 'deleted' : 'updated';
    alert(`Successfully ${actionName} ${count} product(s)`);
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'in_stock': { label: 'In Stock', class: 'success' },
      'low_stock': { label: 'Low Stock', class: 'warning' },
      'out_of_stock': { label: 'Out of Stock', class: 'danger' }
    };
    
    const info = statusMap[status] || { label: status, class: 'default' };
    return <span className={`status-badge ${info.class}`}>{info.label}</span>;
  };

  if (showForm) {
    return (
      <div className="admin-products">
        <div className="page-header">
          <h1>{editingProduct ? 'Edit Product' : 'Add Product'}</h1>
        </div>
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="page-header">
        <div className="header-content">
          <h1>Products</h1>
          <p>Manage your product catalog</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAddProduct} className="btn-primary">
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            value={`${filters.sort_by}-${filters.sort_order}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sort_by', sortBy);
              handleFilterChange('sort_order', sortOrder);
            }}
            className="filter-select"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedIds={selectedProducts}
        categories={categories}
        onAction={handleBulkAction}
        disabled={loading}
      />

      {/* Products Table */}
      <div className="products-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadProducts}>Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products found</p>
            <button onClick={handleAddProduct} className="btn-primary">
              Add Your First Product
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className={!product.is_active ? 'inactive' : ''}>
                      <td className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => handleProductSelect(product.id, e.target.checked)}
                        />
                      </td>
                      <td className="product-col">
                        <div className="product-info">
                          {product.primary_image_url && (
                            <img 
                              src={product.primary_image_url} 
                              alt={product.name}
                              className="product-thumb"
                            />
                          )}
                          <div>
                            <div className="product-name">{product.name}</div>
                            {product.description && (
                              <div className="product-description">
                                {product.description.substring(0, 100)}
                                {product.description.length > 100 && '...'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{product.sku || '—'}</td>
                      <td className="price-col">{formatPrice(product.price)}</td>
                      <td>{product.category?.name || '—'}</td>
                      <td>{getStatusBadge(product.inventory_status)}</td>
                      <td className="stock-col">{product.inventory_count}</td>
                      <td className="actions-col">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="btn-icon"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="btn-icon danger"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="pagination-section">
                <div className="pagination-info">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1}-{Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of {pagination.total_items} products
                </div>
                
                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={!pagination.has_prev}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  
                  <span className="page-info">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={!pagination.has_next}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;