import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './ProductForm.css';

const ProductForm = ({ 
  product = null, 
  categories = [], 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    brand: '',
    price: '',
    category_id: '',
    inventory_status: 'in_stock',
    inventory_count: '0',
    weight_grams: '',
    primary_image_url: '',
    tags: [],
    dimensions_cm: {
      length: '',
      width: '',
      height: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        brand: product.brand || '',
        price: (product.price / 100).toString(), // Convert from cents
        category_id: product.category_id || '',
        inventory_status: product.inventory_status || 'in_stock',
        inventory_count: product.inventory_count?.toString() || '0',
        weight_grams: product.weight_grams?.toString() || '',
        primary_image_url: product.primary_image_url || '',
        tags: product.tags || [],
        dimensions_cm: product.dimensions_cm || {
          length: '',
          width: '',
          height: ''
        }
      });
    }
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDimensionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      dimensions_cm: {
        ...prev.dimensions_cm,
        [field]: value
      }
    }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !formData.tags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please select an image file' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(prev => ({ ...prev, image: 'Image file must be less than 5MB' }));
      return;
    }

    setImageFile(file);
    setErrors(prev => ({ ...prev, image: null }));

    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({
        ...prev,
        primary_image_url: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Product name must be less than 255 characters';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be a valid positive number';
    }

    if (formData.sku && !/^[A-Za-z0-9-]+$/.test(formData.sku)) {
      newErrors.sku = 'SKU can only contain letters, numbers, and hyphens';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    if (formData.brand && formData.brand.length > 100) {
      newErrors.brand = 'Brand must be less than 100 characters';
    }

    if (formData.weight_grams && (isNaN(parseInt(formData.weight_grams)) || parseInt(formData.weight_grams) < 1)) {
      newErrors.weight_grams = 'Weight must be a positive number';
    }

    if (formData.inventory_count && (isNaN(parseInt(formData.inventory_count)) || parseInt(formData.inventory_count) < 0)) {
      newErrors.inventory_count = 'Inventory count must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
        inventory_count: parseInt(formData.inventory_count) || 0,
        weight_grams: formData.weight_grams ? parseInt(formData.weight_grams) : null,
        category_id: formData.category_id || null,
        dimensions_cm: (formData.dimensions_cm.length || formData.dimensions_cm.width || formData.dimensions_cm.height) ? {
          length: parseFloat(formData.dimensions_cm.length) || 0,
          width: parseFloat(formData.dimensions_cm.width) || 0,
          height: parseFloat(formData.dimensions_cm.height) || 0
        } : null
      };

      let savedProduct;
      if (product) {
        savedProduct = await adminAPI.products.update(product.id, submitData);
      } else {
        savedProduct = await adminAPI.products.create(submitData);
      }

      // Handle image upload if there's a new image
      if (imageFile && savedProduct) {
        setUploading(true);
        try {
          await adminAPI.products.uploadImage(savedProduct.id, imageFile);
        } catch (error) {
          console.error('Failed to upload image:', error);
          // Don't fail the entire operation for image upload
        } finally {
          setUploading(false);
        }
      }

      if (onSubmit) {
        onSubmit(savedProduct);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: error.message || 'Failed to save product' });
    }
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h3>Basic Information</h3>
        
        <div className="form-group">
          <label htmlFor="name">Product Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={errors.name ? 'error' : ''}
            required
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="sku">SKU</label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              className={errors.sku ? 'error' : ''}
              placeholder="e.g., PROD-001"
            />
            {errors.sku && <span className="error-message">{errors.sku}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="brand">Brand</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className={errors.brand ? 'error' : ''}
            />
            {errors.brand && <span className="error-message">{errors.brand}</span>}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Pricing & Category</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price ($) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={errors.price ? 'error' : ''}
              required
            />
            {errors.price && <span className="error-message">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category_id">Category</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Inventory</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="inventory_status">Status</label>
            <select
              id="inventory_status"
              name="inventory_status"
              value={formData.inventory_status}
              onChange={handleInputChange}
            >
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="inventory_count">Count</label>
            <input
              type="number"
              id="inventory_count"
              name="inventory_count"
              value={formData.inventory_count}
              onChange={handleInputChange}
              min="0"
              className={errors.inventory_count ? 'error' : ''}
            />
            {errors.inventory_count && <span className="error-message">{errors.inventory_count}</span>}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Physical Properties</h3>
        
        <div className="form-group">
          <label htmlFor="weight_grams">Weight (grams)</label>
          <input
            type="number"
            id="weight_grams"
            name="weight_grams"
            value={formData.weight_grams}
            onChange={handleInputChange}
            min="1"
            className={errors.weight_grams ? 'error' : ''}
          />
          {errors.weight_grams && <span className="error-message">{errors.weight_grams}</span>}
        </div>

        <div className="dimensions-group">
          <label>Dimensions (cm)</label>
          <div className="form-row">
            <input
              type="number"
              placeholder="Length"
              value={formData.dimensions_cm.length}
              onChange={(e) => handleDimensionChange('length', e.target.value)}
              min="0"
              step="0.1"
            />
            <input
              type="number"
              placeholder="Width"
              value={formData.dimensions_cm.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              min="0"
              step="0.1"
            />
            <input
              type="number"
              placeholder="Height"
              value={formData.dimensions_cm.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Image & Tags</h3>
        
        <div className="form-group">
          <label htmlFor="image">Product Image</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageUpload}
            className={errors.image ? 'error' : ''}
          />
          {errors.image && <span className="error-message">{errors.image}</span>}
          {formData.primary_image_url && (
            <div className="image-preview">
              <img 
                src={formData.primary_image_url} 
                alt="Preview" 
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagInput}
            placeholder="Type and press Enter to add tags"
          />
          <div className="tags-display">
            {formData.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="error-message submit-error">
          {errors.submit}
        </div>
      )}

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={loading || uploading}>
          Cancel
        </button>
        <button type="submit" disabled={loading || uploading}>
          {loading || uploading 
            ? (uploading ? 'Uploading...' : 'Saving...') 
            : (product ? 'Update Product' : 'Create Product')
          }
        </button>
      </div>
    </form>
  );
};

export default ProductForm;