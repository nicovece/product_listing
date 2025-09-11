const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const ProductManagement = require('../../lib/product-management');
const AdminValidation = require('../../lib/admin-validation');
const FileUpload = require('../../lib/file-upload');

// Create file uploader instance
const fileUploader = new FileUpload();

// GET /api/admin/products - List all products for management
router.get('/', 
  AdminValidation.createValidationMiddleware('productListQuery', { source: 'query' }),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 25,
        category,
        status,
        search,
        sort_by = 'name',
        sort_order = 'asc'
      } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        category: category ? parseInt(category) : null,
        status,
        search,
        sortBy: sort_by,
        sortOrder: sort_order
      };

      const result = ProductManagement.findAll(filters);
      
      res.json({
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch products'
      });
    }
  }
);

// GET /api/admin/products/:id - Get single product for editing
router.get('/:id',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const product = ProductManagement.findById(parseInt(id));
      
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch product'
      });
    }
  }
);

// POST /api/admin/products - Create new product
router.post('/',
  AdminValidation.createValidationMiddleware('createProductRequest'),
  async (req, res) => {
    try {
      const productData = req.body;
      const product = ProductManagement.create(productData);
      
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Product with this SKU already exists',
          details: { fields: { sku: ['SKU must be unique'] } }
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create product'
      });
    }
  }
);

// PUT /api/admin/products/:id - Update existing product
router.put('/:id',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  AdminValidation.createValidationMiddleware('updateProductRequest'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const product = ProductManagement.update(parseInt(id), updateData);
      
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Product with this SKU already exists',
          details: { fields: { sku: ['SKU must be unique'] } }
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update product'
      });
    }
  }
);

// DELETE /api/admin/products/:id - Delete product (soft delete)
router.delete('/:id',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const success = ProductManagement.delete(parseInt(id));
      
      if (!success) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete product'
      });
    }
  }
);

// PATCH /api/admin/products/bulk - Bulk update products
router.patch('/bulk',
  AdminValidation.createValidationMiddleware('bulkUpdateRequest'),
  async (req, res) => {
    try {
      const { product_ids, updates } = req.body;
      const result = ProductManagement.bulkUpdate(product_ids, updates);
      
      res.json({
        updated_count: result.updated_count,
        failed_items: result.failed_items
      });
    } catch (error) {
      console.error('Error bulk updating products:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to bulk update products'
      });
    }
  }
);

// DELETE /api/admin/products/bulk - Bulk delete products
router.delete('/bulk',
  AdminValidation.createValidationMiddleware('bulkDeleteRequest'),
  async (req, res) => {
    try {
      const { product_ids } = req.body;
      const result = ProductManagement.bulkDelete(product_ids);
      
      res.json({
        deleted_count: result.deleted_count,
        failed_items: result.failed_items
      });
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to bulk delete products'
      });
    }
  }
);

// GET /api/admin/products/stats/inventory - Get inventory statistics
router.get('/stats/inventory', async (req, res) => {
  try {
    const stats = ProductManagement.getInventoryStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory statistics'
    });
  }
});

// GET /api/admin/products/low-stock - Get low stock products
router.get('/low-stock', async (req, res) => {
  try {
    const threshold = req.query.threshold ? parseInt(req.query.threshold) : 5;
    const products = Product.getLowStockProducts(threshold);
    
    res.json({
      data: products,
      threshold,
      total: products.length
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch low stock products'
    });
  }
});

// POST /api/admin/products/:id/upload-image - Upload product image
router.post('/:id/upload-image',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  fileUploader.createUploader({ single: true, fieldName: 'image' }),
  fileUploader.createValidationMiddleware(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'No image file provided'
        });
      }

      // Check if product exists
      const product = ProductManagement.findById(parseInt(id));
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      // Save file and get URL
      const savedFile = await fileUploader.saveFile(file, 'products');
      
      // Update product with new image URL
      const updatedProduct = ProductManagement.update(parseInt(id), {
        primary_image_url: savedFile.url,
        imageUrl: savedFile.url
      });

      res.json({
        product: updatedProduct,
        image: {
          url: savedFile.url,
          filename: savedFile.filename,
          size: savedFile.size
        }
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to upload image'
      });
    }
  }
);

// DELETE /api/admin/products/:id/image - Remove product image
router.delete('/:id/image',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const product = ProductManagement.findById(parseInt(id));
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      // Delete image file if exists
      if (product.primary_image_url) {
        const filename = FileUpload.extractFilenameFromUrl(product.primary_image_url);
        if (filename) {
          await fileUploader.deleteFile(filename, 'products');
        }
      }

      // Update product to remove image URL
      const updatedProduct = ProductManagement.update(parseInt(id), {
        primary_image_url: null,
        imageUrl: null
      });

      res.json(updatedProduct);
    } catch (error) {
      console.error('Error removing image:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove image'
      });
    }
  }
);

// PATCH /api/admin/products/:id/inventory - Update inventory status
router.patch('/:id/inventory',
  AdminValidation.createValidationMiddleware('idParam', { source: 'params' }),
  AdminValidation.createValidationMiddleware('inventoryUpdateRequest'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { inventory_status, inventory_count } = req.body;
      
      const product = Product.updateInventoryStatus(
        parseInt(id), 
        inventory_status, 
        inventory_count
      );
      
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      res.json(product);
    } catch (error) {
      console.error('Error updating inventory:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update inventory'
      });
    }
  }
);

// GET /api/admin/products/search - Advanced product search
router.get('/search',
  AdminValidation.createValidationMiddleware('productSearchQuery', { source: 'query' }),
  async (req, res) => {
    try {
      const { q: searchTerm, ...filters } = req.query;
      
      const products = Product.searchAdmin(searchTerm, {
        category: filters.category ? parseInt(filters.category) : null,
        status: filters.status,
        priceMin: filters.price_min ? parseInt(filters.price_min) : null,
        priceMax: filters.price_max ? parseInt(filters.price_max) : null,
        hasImage: filters.has_image !== undefined ? filters.has_image === 'true' : null,
        hasSku: filters.has_sku !== undefined ? filters.has_sku === 'true' : null
      });

      res.json({
        data: products,
        total: products.length,
        search_term: searchTerm,
        filters
      });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to search products'
      });
    }
  }
);

module.exports = router;