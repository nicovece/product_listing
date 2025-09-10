const express = require('express');
const router = express.Router();
const Category = require('../../models/Category');
const CategoryManagement = require('../../lib/category-management');
const AdminValidation = require('../../lib/admin-validation');

// GET /api/admin/categories - List all categories
router.get('/', 
  AdminValidation.createValidationMiddleware('categoryListQuery', { source: 'query' }),
  async (req, res) => {
    try {
      const { include_products = false } = req.query;
      const result = CategoryManagement.findAll({ 
        includeProducts: include_products === 'true' 
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch categories'
      });
    }
  }
);

// GET /api/admin/categories/hierarchy - Get category hierarchy
router.get('/hierarchy', async (req, res) => {
  try {
    const hierarchy = CategoryManagement.getHierarchy();
    
    res.json({
      data: hierarchy,
      total_root_categories: hierarchy.length
    });
  } catch (error) {
    console.error('Error fetching category hierarchy:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch category hierarchy'
    });
  }
});

// GET /api/admin/categories/stats - Get category statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = Category.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch category statistics'
    });
  }
});

// GET /api/admin/categories/:id - Get single category
router.get('/:id',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const category = CategoryManagement.findById(parseInt(id));
      
      if (!category) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Category not found'
        });
      }

      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch category'
      });
    }
  }
);

// GET /api/admin/categories/:id/children - Get category children
router.get('/:id/children',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { include_products = false } = req.query;
      
      const children = CategoryManagement.getChildCategories(
        parseInt(id), 
        include_products === 'true'
      );
      
      res.json({
        data: children,
        parent_id: parseInt(id),
        total: children.length
      });
    } catch (error) {
      console.error('Error fetching category children:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch category children'
      });
    }
  }
);

// GET /api/admin/categories/:id/path - Get category path
router.get('/:id/path',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const path = CategoryManagement.getCategoryPath(parseInt(id));
      
      if (path.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Category not found'
        });
      }

      res.json({
        data: path,
        depth: path.length
      });
    } catch (error) {
      console.error('Error fetching category path:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch category path'
      });
    }
  }
);

// POST /api/admin/categories - Create new category
router.post('/',
  AdminValidation.createValidationMiddleware('createCategoryRequest'),
  async (req, res) => {
    try {
      const categoryData = req.body;
      
      // Check if parent category exists and would create circular reference
      if (categoryData.parent_category_id) {
        const parentCategory = CategoryManagement.findById(categoryData.parent_category_id);
        if (!parentCategory) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Parent category does not exist',
            details: { fields: { parent_category_id: ['Parent category not found'] } }
          });
        }
      }

      const category = CategoryManagement.create(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Category with this name already exists',
          details: { fields: { name: ['Name must be unique'] } }
        });
      }

      if (error.message.includes('circular')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
          details: { fields: { parent_category_id: [error.message] } }
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create category'
      });
    }
  }
);

// PUT /api/admin/categories/:id - Update existing category
router.put('/:id',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  AdminValidation.createValidationMiddleware('updateCategoryRequest'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Check if parent category exists (if being updated)
      if (updateData.parent_category_id) {
        const parentCategory = CategoryManagement.findById(updateData.parent_category_id);
        if (!parentCategory) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Parent category does not exist',
            details: { fields: { parent_category_id: ['Parent category not found'] } }
          });
        }
      }
      
      const category = CategoryManagement.update(parseInt(id), updateData);
      
      if (!category) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Category not found'
        });
      }

      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Category with this name already exists',
          details: { fields: { name: ['Name must be unique'] } }
        });
      }

      if (error.message.includes('circular')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
          details: { fields: { parent_category_id: [error.message] } }
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update category'
      });
    }
  }
);

// DELETE /api/admin/categories/:id - Delete category
router.delete('/:id',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const success = CategoryManagement.delete(parseInt(id));
      
      if (!success) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Category not found'
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      
      if (error.message.includes('products')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message
        });
      }

      if (error.message.includes('child')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete category'
      });
    }
  }
);

// PATCH /api/admin/categories/:id/move - Move category to new parent
router.patch('/:id/move',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  AdminValidation.createValidationMiddleware('moveCategoryRequest'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { parent_category_id, sort_order } = req.body;
      
      // Check if parent category exists (if specified)
      if (parent_category_id) {
        const parentCategory = CategoryManagement.findById(parent_category_id);
        if (!parentCategory) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Parent category does not exist',
            details: { fields: { parent_category_id: ['Parent category not found'] } }
          });
        }
      }
      
      const category = CategoryManagement.moveCategory(
        parseInt(id), 
        parent_category_id, 
        sort_order
      );
      
      if (!category) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Category not found'
        });
      }

      res.json(category);
    } catch (error) {
      console.error('Error moving category:', error);
      
      if (error.message.includes('circular')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
          details: { fields: { parent_category_id: [error.message] } }
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to move category'
      });
    }
  }
);

// PATCH /api/admin/categories/:id/reorder - Reorder category within siblings
router.patch('/:id/reorder',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { sort_order } = req.body;
      
      if (typeof sort_order !== 'number' || sort_order < 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'sort_order must be a non-negative number',
          details: { fields: { sort_order: ['Must be a non-negative number'] } }
        });
      }
      
      const success = Category.reorderCategories(parseInt(id), sort_order);
      
      if (!success) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Category not found'
        });
      }

      const category = CategoryManagement.findById(parseInt(id));
      res.json(category);
    } catch (error) {
      console.error('Error reordering category:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reorder category'
      });
    }
  }
);

// GET /api/admin/categories/search - Search categories by name
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm, include_products = false } = req.query;
    
    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Search term is required',
        details: { fields: { q: ['Search term cannot be empty'] } }
      });
    }

    const categories = Category.searchByName(
      searchTerm, 
      include_products === 'true'
    );

    res.json({
      data: categories,
      total: categories.length,
      search_term: searchTerm
    });
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search categories'
    });
  }
});

// GET /api/admin/categories/roots - Get root categories only
router.get('/roots', async (req, res) => {
  try {
    const rootCategories = Category.findRootCategories();
    
    res.json({
      data: rootCategories,
      total: rootCategories.length
    });
  } catch (error) {
    console.error('Error fetching root categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch root categories'
    });
  }
});

// GET /api/admin/categories/leaves - Get leaf categories (no children)
router.get('/leaves', async (req, res) => {
  try {
    const leafCategories = Category.findLeafCategories();
    
    res.json({
      data: leafCategories,
      total: leafCategories.length
    });
  } catch (error) {
    console.error('Error fetching leaf categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch leaf categories'
    });
  }
});

// GET /api/admin/categories/:id/products - Get products in category
router.get('/:id/products',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { include_inactive = false } = req.query;
      
      const products = require('../../models/Product').getProductsByCategory(
        parseInt(id), 
        include_inactive === 'true'
      );

      res.json({
        data: products,
        category_id: parseInt(id),
        total: products.length
      });
    } catch (error) {
      console.error('Error fetching category products:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch category products'
      });
    }
  }
);

module.exports = router;