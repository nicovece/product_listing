const AdminValidation = require('../lib/admin-validation');

// General validation middleware factory
function validateRequest(schemaName, options = {}) {
  return AdminValidation.createValidationMiddleware(schemaName, options);
}

// Specific validation middlewares for common use cases
const validateId = validateRequest('idParam', { source: 'params' });

const validatePagination = validateRequest('paginationQuery', { source: 'query' });

const validateProductList = validateRequest('productListQuery', { source: 'query' });

const validateCategoryList = validateRequest('categoryListQuery', { source: 'query' });

// Product validation middlewares
const validateCreateProduct = validateRequest('createProductRequest');

const validateUpdateProduct = validateRequest('updateProductRequest');

const validateBulkUpdate = validateRequest('bulkUpdateRequest');

const validateBulkDelete = validateRequest('bulkDeleteRequest');

// Category validation middlewares
const validateCreateCategory = validateRequest('createCategoryRequest');

const validateUpdateCategory = validateRequest('updateCategoryRequest');

const validateMoveCategory = validateRequest('moveCategoryRequest');

// Search validation middleware
const validateProductSearch = validateRequest('productSearchQuery', { source: 'query' });

// File upload validation middleware
const validateFileUpload = validateRequest('fileUploadRequest');

// Inventory management validation
const validateInventoryUpdate = validateRequest('inventoryUpdateRequest');

const validateBulkInventoryUpdate = validateRequest('bulkInventoryUpdateRequest');

// Advanced filtering validation
const validateAdvancedFilter = validateRequest('advancedProductFilter', { source: 'query' });

// Error handling middleware for validation errors
function handleValidationErrors(err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }
  next(err);
}

// Middleware to validate that referenced resources exist
function validateResourceExists(resourceType, idField = 'id') {
  return async (req, res, next) => {
    try {
      let resourceId;
      
      if (req.params[idField]) {
        resourceId = parseInt(req.params[idField]);
      } else if (req.body[idField]) {
        resourceId = parseInt(req.body[idField]);
      } else {
        return next(); // No ID to validate
      }

      let resource = null;
      
      switch (resourceType) {
        case 'product':
          const Product = require('../models/Product');
          resource = Product.findByIdAdmin(resourceId);
          break;
          
        case 'category':
          const Category = require('../models/Category');
          resource = Category.findById(resourceId);
          break;
          
        default:
          return res.status(500).json({
            error: 'Internal Error',
            message: `Unknown resource type: ${resourceType}`
          });
      }

      if (!resource) {
        const resourceName = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
        return res.status(404).json({
          error: 'Not Found',
          message: `${resourceName} not found`
        });
      }

      req[resourceType] = resource;
      next();
    } catch (error) {
      console.error(`Error validating ${resourceType} exists:`, error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: `Failed to validate ${resourceType}`
      });
    }
  };
}

// Middleware to validate category hierarchy operations
function validateCategoryHierarchy() {
  return async (req, res, next) => {
    try {
      const categoryId = req.params.id ? parseInt(req.params.id) : null;
      const parentId = req.body.parent_category_id ? parseInt(req.body.parent_category_id) : null;

      if (!parentId) {
        return next(); // No parent, no circular reference possible
      }

      if (categoryId === parentId) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Category cannot be its own parent',
          details: { fields: { parent_category_id: ['Cannot be self-referential'] } }
        });
      }

      const Category = require('../models/Category');
      
      if (categoryId && !Category.validateHierarchy(categoryId, parentId)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Cannot create circular reference in category hierarchy',
          details: { fields: { parent_category_id: ['Would create circular reference'] } }
        });
      }

      next();
    } catch (error) {
      console.error('Error validating category hierarchy:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to validate category hierarchy'
      });
    }
  };
}

// Middleware to validate that a category can be deleted
function validateCategoryDeletion() {
  return async (req, res, next) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      const Category = require('../models/Category');
      const Product = require('../models/Product');

      // Check for products
      const products = Product.getProductsByCategory(categoryId);
      if (products.length > 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Cannot delete category with products',
          details: { 
            product_count: products.length,
            message: 'Move or delete products first'
          }
        });
      }

      // Check for child categories
      const children = Category.findChildren(categoryId);
      if (children.length > 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Cannot delete category with child categories',
          details: { 
            child_count: children.length,
            message: 'Move or delete child categories first'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Error validating category deletion:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to validate category deletion'
      });
    }
  };
}

// Middleware to validate bulk operations
function validateBulkOperation(maxItems = 100) {
  return (req, res, next) => {
    const { product_ids } = req.body;

    if (!Array.isArray(product_ids)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'product_ids must be an array',
        details: { fields: { product_ids: ['Must be an array'] } }
      });
    }

    if (product_ids.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'product_ids cannot be empty',
        details: { fields: { product_ids: ['At least one ID required'] } }
      });
    }

    if (product_ids.length > maxItems) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Cannot process more than ${maxItems} items at once`,
        details: { fields: { product_ids: [`Maximum ${maxItems} items allowed`] } }
      });
    }

    // Check for duplicates
    const uniqueIds = [...new Set(product_ids)];
    if (uniqueIds.length !== product_ids.length) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Duplicate product IDs detected',
        details: { fields: { product_ids: ['All IDs must be unique'] } }
      });
    }

    next();
  };
}

// Middleware to validate file uploads
function validateFileUploadRequest() {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'No files uploaded'
      });
    }

    const FileUpload = require('../lib/file-upload');
    const files = req.files || (req.file ? [req.file] : []);
    const errors = [];

    for (const file of files) {
      const fileErrors = FileUpload.prototype.validateFile(file);
      if (fileErrors.length > 0) {
        errors.push(...fileErrors.map(error => `${file.originalname}: ${error}`));
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'File Validation Error',
        message: 'One or more files are invalid',
        details: { files: errors }
      });
    }

    next();
  };
}

// Middleware to sanitize input data
function sanitizeInput() {
  return (req, res, next) => {
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      return str.trim().replace(/<script[^>]*>.*?<\/script>/gi, '');
    };

    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      if (Array.isArray(obj)) return obj.map(sanitizeObject);
      
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object') {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };

    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    
    next();
  };
}

// Rate limiting middleware for admin endpoints
function createRateLimit(windowMs = 15 * 60 * 1000, max = 100) {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    requests.set(key, validRequests);

    if (validRequests.length >= max) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${max} requests per ${windowMs / 60000} minutes.`,
        retry_after: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }

    validRequests.push(now);
    requests.set(key, validRequests);

    next();
  };
}

module.exports = {
  // General validation
  validateRequest,
  validateId,
  validatePagination,
  
  // Product validation
  validateProductList,
  validateCreateProduct,
  validateUpdateProduct,
  validateBulkUpdate,
  validateBulkDelete,
  validateProductSearch,
  validateInventoryUpdate,
  validateBulkInventoryUpdate,
  
  // Category validation
  validateCategoryList,
  validateCreateCategory,
  validateUpdateCategory,
  validateMoveCategory,
  validateCategoryHierarchy,
  validateCategoryDeletion,
  
  // File validation
  validateFileUpload,
  validateFileUploadRequest,
  
  // Advanced validation
  validateAdvancedFilter,
  validateResourceExists,
  validateBulkOperation,
  
  // Utility middleware
  handleValidationErrors,
  sanitizeInput,
  createRateLimit
};