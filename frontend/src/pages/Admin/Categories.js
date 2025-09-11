import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import './Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' or 'list'

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_category_id: '',
    sort_order: 0
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [listResponse, hierarchyResponse] = await Promise.all([
        adminAPI.categories.list(true), // Include product counts
        adminAPI.categories.getHierarchy()
      ]);
      
      setCategories(listResponse.data || []);
      setHierarchy(hierarchyResponse.data || []);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    }
    
    if (formData.name.length > 100) {
      errors.name = 'Category name must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        parent_category_id: formData.parent_category_id || null,
        sort_order: parseInt(formData.sort_order) || 0
      };
      
      if (editingCategory) {
        await adminAPI.categories.update(editingCategory.id, submitData);
      } else {
        await adminAPI.categories.create(submitData);
      }
      
      handleFormCancel();
      loadCategories();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to save category' });
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', parent_category_id: '', sort_order: 0 });
    setFormErrors({});
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      parent_category_id: category.parent_category_id || '',
      sort_order: category.sort_order || 0
    });
    setShowForm(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }
    
    try {
      await adminAPI.categories.delete(categoryId);
      loadCategories();
    } catch (err) {
      alert('Failed to delete category: ' + err.message);
    }
  };

  const renderCategoryHierarchy = (categories, level = 0) => {
    return categories.map(category => (
      <div key={category.id} className="hierarchy-item" style={{ marginLeft: `${level * 20}px` }}>
        <div className="category-card">
          <div className="category-info">
            <div className="category-header">
              <h4 className="category-name">{category.name}</h4>
              <div className="category-actions">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="btn-icon"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="btn-icon danger"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            {category.description && (
              <p className="category-description">{category.description}</p>
            )}
            
            <div className="category-meta">
              <span className="product-count">
                {category.product_count || 0} product{(category.product_count || 0) !== 1 ? 's' : ''}
              </span>
              {level > 0 && (
                <span className="category-level">Level {level + 1}</span>
              )}
            </div>
          </div>
        </div>
        
        {category.children && category.children.length > 0 && (
          <div className="category-children">
            {renderCategoryHierarchy(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderCategoryList = () => {
    return (
      <div className="categories-table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Parent</th>
              <th>Products</th>
              <th>Sort Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => {
              const parentCategory = categories.find(c => c.id === category.parent_category_id);
              
              return (
                <tr key={category.id}>
                  <td className="name-col">
                    <div className="category-name-cell">
                      {category.name}
                    </div>
                  </td>
                  <td className="description-col">
                    {category.description ? (
                      <div className="category-description-cell">
                        {category.description.length > 100
                          ? `${category.description.substring(0, 100)}...`
                          : category.description
                        }
                      </div>
                    ) : (
                      <span className="no-description">—</span>
                    )}
                  </td>
                  <td className="parent-col">
                    {parentCategory ? parentCategory.name : '—'}
                  </td>
                  <td className="products-col">
                    <Link 
                      to={`/admin/products?category=${category.id}`}
                      className="product-count-link"
                    >
                      {category.product_count || 0}
                    </Link>
                  </td>
                  <td className="sort-col">{category.sort_order}</td>
                  <td className="actions-col">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="btn-icon"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="btn-icon danger"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-categories">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-categories">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadCategories}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-categories">
      <div className="page-header">
        <div className="header-content">
          <h1>Categories</h1>
          <p>Organize your products into categories</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'hierarchy' ? 'active' : ''}
              onClick={() => setViewMode('hierarchy')}
            >
              🏗️ Hierarchy
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              📋 List
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Add Category
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-section">
          <div className="form-card">
            <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Category Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormInputChange}
                    className={formErrors.name ? 'error' : ''}
                    required
                  />
                  {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="parent_category_id">Parent Category</label>
                  <select
                    id="parent_category_id"
                    name="parent_category_id"
                    value={formData.parent_category_id}
                    onChange={handleFormInputChange}
                  >
                    <option value="">No Parent (Root Category)</option>
                    {categories
                      .filter(c => !editingCategory || c.id !== editingCategory.id)
                      .map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="sort_order">Sort Order</label>
                  <input
                    type="number"
                    id="sort_order"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleFormInputChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormInputChange}
                  rows={3}
                  className={formErrors.description ? 'error' : ''}
                />
                {formErrors.description && <span className="error-message">{formErrors.description}</span>}
              </div>

              {formErrors.submit && (
                <div className="error-message submit-error">
                  {formErrors.submit}
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={handleFormCancel}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="categories-section">
        {categories.length === 0 ? (
          <div className="empty-state">
            <p>No categories found</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add Your First Category
            </button>
          </div>
        ) : viewMode === 'hierarchy' ? (
          <div className="hierarchy-view">
            {hierarchy.length === 0 ? (
              <div className="empty-hierarchy">
                <p>No category hierarchy available</p>
              </div>
            ) : (
              renderCategoryHierarchy(hierarchy)
            )}
          </div>
        ) : (
          <div className="list-view">
            {renderCategoryList()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;