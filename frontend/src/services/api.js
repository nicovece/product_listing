const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Helper function for API requests
const apiRequest = async (url, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Helper function for FormData requests (file uploads)
const apiRequestFormData = async (url, formData, options = {}) => {
  const config = {
    method: 'POST',
    body: formData,
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Public API functions
export const fetchProducts = async (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== '') {
      params.append(key, value);
    }
  });

  return apiRequest(`/api/products?${params}`);
};

export const healthCheck = async () => {
  return apiRequest('/health');
};

// Admin API functions for products
export const adminAPI = {
  // Product management
  products: {
    list: async (filters = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });
      return apiRequest(`/api/admin/products?${params}`);
    },

    get: async (id) => {
      return apiRequest(`/api/admin/products/${id}`);
    },

    create: async (productData) => {
      return apiRequest('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    },

    update: async (id, productData) => {
      return apiRequest(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
    },

    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return response.status === 204;
    },

    bulkUpdate: async (productIds, updates) => {
      return apiRequest('/api/admin/products/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ product_ids: productIds, updates }),
      });
    },

    bulkDelete: async (productIds) => {
      return apiRequest('/api/admin/products/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ product_ids: productIds }),
      });
    },

    getStats: async () => {
      return apiRequest('/api/admin/products/stats/inventory');
    },

    getLowStock: async (threshold = 5) => {
      return apiRequest(`/api/admin/products/low-stock?threshold=${threshold}`);
    },

    search: async (query, filters = {}) => {
      const params = new URLSearchParams({ q: query });
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });
      return apiRequest(`/api/admin/products/search?${params}`);
    },

    uploadImage: async (id, imageFile, altText = '') => {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (altText) {
        formData.append('alt_text', altText);
      }
      return apiRequestFormData(`/api/admin/products/${id}/upload-image`, formData);
    },

    removeImage: async (id) => {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}/image`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },

    updateInventory: async (id, inventoryStatus, inventoryCount = null) => {
      const updates = { inventory_status: inventoryStatus };
      if (inventoryCount !== null) {
        updates.inventory_count = inventoryCount;
      }
      return apiRequest(`/api/admin/products/${id}/inventory`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
  },

  // Category management
  categories: {
    list: async (includeProducts = false) => {
      const params = includeProducts ? '?include_products=true' : '';
      return apiRequest(`/api/admin/categories${params}`);
    },

    get: async (id) => {
      return apiRequest(`/api/admin/categories/${id}`);
    },

    create: async (categoryData) => {
      return apiRequest('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
    },

    update: async (id, categoryData) => {
      return apiRequest(`/api/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      });
    },

    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return response.status === 204;
    },

    getHierarchy: async () => {
      return apiRequest('/api/admin/categories/hierarchy');
    },

    getChildren: async (id, includeProducts = false) => {
      const params = includeProducts ? '?include_products=true' : '';
      return apiRequest(`/api/admin/categories/${id}/children${params}`);
    },

    getPath: async (id) => {
      return apiRequest(`/api/admin/categories/${id}/path`);
    },

    move: async (id, parentCategoryId, sortOrder = null) => {
      const updates = { parent_category_id: parentCategoryId };
      if (sortOrder !== null) {
        updates.sort_order = sortOrder;
      }
      return apiRequest(`/api/admin/categories/${id}/move`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    reorder: async (id, sortOrder) => {
      return apiRequest(`/api/admin/categories/${id}/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ sort_order: sortOrder }),
      });
    },

    search: async (query, includeProducts = false) => {
      const params = new URLSearchParams({ q: query });
      if (includeProducts) {
        params.append('include_products', 'true');
      }
      return apiRequest(`/api/admin/categories/search?${params}`);
    },

    getRoots: async () => {
      return apiRequest('/api/admin/categories/roots');
    },

    getLeaves: async () => {
      return apiRequest('/api/admin/categories/leaves');
    },

    getStats: async () => {
      return apiRequest('/api/admin/categories/stats');
    },

    getProducts: async (id, includeInactive = false) => {
      const params = includeInactive ? '?include_inactive=true' : '';
      return apiRequest(`/api/admin/categories/${id}/products${params}`);
    },
  },
};