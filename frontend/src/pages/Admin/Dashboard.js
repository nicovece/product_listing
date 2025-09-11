import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    products: { total: 0, by_status: [] },
    categories: { total: 0, with_products: 0, empty: 0 },
    lowStock: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [productStats, categoryStats, lowStock] = await Promise.all([
        adminAPI.products.getStats(),
        adminAPI.categories.getStats(),
        adminAPI.products.getLowStock(10) // Get products with stock <= 10
      ]);

      setStats({
        products: productStats,
        categories: categoryStats,
        lowStock: lowStock.data || []
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalProducts = () => {
    return stats.products.by_status?.reduce((total, item) => total + item.count, 0) || 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return '#28a745';
      case 'low_stock': return '#ffc107';
      case 'out_of_stock': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of your product catalog and inventory</p>
      </div>

      <div className="dashboard-grid">
        {/* Quick Stats Cards */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <div className="stat-number">{getTotalProducts()}</div>
                <div className="stat-label">Total Products</div>
              </div>
              <Link to="/admin/products" className="stat-link">
                View All →
              </Link>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📁</div>
              <div className="stat-content">
                <div className="stat-number">{stats.categories.total_categories || 0}</div>
                <div className="stat-label">Categories</div>
              </div>
              <Link to="/admin/categories" className="stat-link">
                Manage →
              </Link>
            </div>

            <div className="stat-card warning">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <div className="stat-number">{stats.lowStock.length}</div>
                <div className="stat-label">Low Stock Items</div>
              </div>
              <Link to="/admin/products?status=low_stock" className="stat-link">
                Review →
              </Link>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-number">{stats.categories.categories_with_products || 0}</div>
                <div className="stat-label">Active Categories</div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Status Chart */}
        <div className="chart-section">
          <div className="section-card">
            <h3>Inventory Status</h3>
            <div className="inventory-chart">
              {stats.products.by_status?.map((item, index) => (
                <div key={index} className="inventory-item">
                  <div className="inventory-bar">
                    <div 
                      className="inventory-fill"
                      style={{ 
                        width: `${(item.count / getTotalProducts()) * 100}%`,
                        backgroundColor: getStatusColor(item.inventory_status)
                      }}
                    ></div>
                  </div>
                  <div className="inventory-details">
                    <span className="inventory-label">
                      {item.inventory_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="inventory-count">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {stats.lowStock.length > 0 && (
          <div className="alert-section">
            <div className="section-card alert">
              <h3>⚠️ Low Stock Alert</h3>
              <div className="low-stock-list">
                {stats.lowStock.slice(0, 5).map((product) => (
                  <div key={product.id} className="low-stock-item">
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-sku">{product.sku || 'No SKU'}</div>
                    </div>
                    <div className="stock-info">
                      <span className="stock-count">{product.inventory_count}</span>
                      <span className="stock-label">remaining</span>
                    </div>
                  </div>
                ))}
              </div>
              {stats.lowStock.length > 5 && (
                <Link to="/admin/products?status=low_stock" className="view-all-link">
                  View all {stats.lowStock.length} low stock items →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="actions-section">
          <div className="section-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <Link to="/admin/products/new" className="action-btn primary">
                <span className="action-icon">➕</span>
                Add Product
              </Link>
              <Link to="/admin/categories/new" className="action-btn">
                <span className="action-icon">📁</span>
                Add Category
              </Link>
              <Link to="/admin/products?status=out_of_stock" className="action-btn warning">
                <span className="action-icon">📋</span>
                Review Out of Stock
              </Link>
              <button 
                onClick={loadDashboardData} 
                className="action-btn"
                title="Refresh Dashboard"
              >
                <span className="action-icon">🔄</span>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Category Overview */}
        <div className="category-section">
          <div className="section-card">
            <h3>Category Overview</h3>
            <div className="category-stats">
              <div className="category-stat">
                <span className="category-number">{stats.categories.root_categories || 0}</span>
                <span className="category-label">Root Categories</span>
              </div>
              <div className="category-stat">
                <span className="category-number">{stats.categories.categories_with_products || 0}</span>
                <span className="category-label">With Products</span>
              </div>
              <div className="category-stat">
                <span className="category-number">{stats.categories.empty_categories || 0}</span>
                <span className="category-label">Empty</span>
              </div>
            </div>
            <Link to="/admin/categories" className="section-link">
              Manage Categories →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;