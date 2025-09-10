const { z } = require('zod');

// Common validation patterns
const idSchema = z.coerce.number().int().positive();
const skuSchema = z.string().regex(/^[A-Za-z0-9-]+$/).max(50);
const inventoryStatusSchema = z.enum(['in_stock', 'out_of_stock', 'low_stock']);
const urlSchema = z.string().url();

// Product validation schemas
const createProductRequest = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  sku: skuSchema.optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  price: z.number().int().min(0),
  category_id: idSchema.optional().nullable(),
  inventory_status: inventoryStatusSchema.default('in_stock'),
  inventory_count: z.number().int().min(0).default(0),
  weight_grams: z.number().int().min(1).optional().nullable(),
  dimensions_cm: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0)
  }).optional().nullable(),
  primary_image_url: urlSchema.optional().nullable(),
  tags: z.array(z.string().max(50)).default([])
}).strict();

const updateProductRequest = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  sku: skuSchema.optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  price: z.number().int().min(0).optional(),
  category_id: idSchema.optional().nullable(),
  inventory_status: inventoryStatusSchema.optional(),
  inventory_count: z.number().int().min(0).optional(),
  weight_grams: z.number().int().min(1).optional().nullable(),
  dimensions_cm: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0)
  }).optional().nullable(),
  primary_image_url: urlSchema.optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
  is_active: z.boolean().optional()
}).strict();

const bulkUpdateRequest = z.object({
  product_ids: z.array(idSchema).min(1),
  updates: z.object({
    category_id: idSchema.optional().nullable(),
    inventory_status: inventoryStatusSchema.optional(),
    price: z.number().int().min(0).optional(),
    is_active: z.boolean().optional()
  }).strict()
}).strict();

const bulkDeleteRequest = z.object({
  product_ids: z.array(idSchema).min(1)
}).strict();

// Category validation schemas
const createCategoryRequest = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  parent_category_id: idSchema.optional().nullable(),
  sort_order: z.number().int().min(0).default(0)
}).strict();

const updateCategoryRequest = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  parent_category_id: idSchema.optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional()
}).strict();

// Query parameter schemas
const productListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  category: z.coerce.number().int().positive().optional(),
  status: inventoryStatusSchema.optional(),
  search: z.string().trim().optional(),
  sort_by: z.enum(['name', 'price', 'inventory_status', 'created_at', 'updated_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
}).strict();

const categoryListQuery = z.object({
  include_products: z.coerce.boolean().default(false)
}).strict();

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25)
}).strict();

// Path parameter schemas
const idParam = z.object({
  id: idSchema
}).strict();

// File upload schemas
const fileUploadRequest = z.object({
  file: z.object({
    originalname: z.string(),
    mimetype: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/i),
    size: z.number().max(5 * 1024 * 1024), // 5MB max
    buffer: z.instanceof(Buffer).optional(),
    path: z.string().optional()
  }),
  alt_text: z.string().max(200).optional()
}).strict();

const multipleFileUploadRequest = z.object({
  files: z.array(z.object({
    originalname: z.string(),
    mimetype: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/i),
    size: z.number().max(5 * 1024 * 1024)
  })).max(10) // Max 10 files
}).strict();

// Search and filter schemas
const productSearchQuery = z.object({
  q: z.string().trim().min(1).max(100),
  category: z.coerce.number().int().positive().optional(),
  status: inventoryStatusSchema.optional(),
  price_min: z.coerce.number().int().min(0).optional(),
  price_max: z.coerce.number().int().min(0).optional(),
  has_sku: z.coerce.boolean().optional(),
  has_image: z.coerce.boolean().optional(),
  tags: z.string().transform(str => str.split(',').map(tag => tag.trim())).optional()
}).strict().refine(data => {
  if (data.price_min && data.price_max) {
    return data.price_min <= data.price_max;
  }
  return true;
}, {
  message: "price_min must be less than or equal to price_max"
});

// Inventory management schemas
const inventoryUpdateRequest = z.object({
  inventory_status: inventoryStatusSchema,
  inventory_count: z.number().int().min(0).optional(),
  reason: z.string().max(200).optional()
}).strict();

const bulkInventoryUpdateRequest = z.object({
  product_ids: z.array(idSchema).min(1),
  inventory_status: inventoryStatusSchema,
  inventory_count: z.number().int().min(0).optional(),
  reason: z.string().max(200).optional()
}).strict();

// Category hierarchy schemas
const moveCategoryRequest = z.object({
  parent_category_id: idSchema.nullable(),
  sort_order: z.number().int().min(0).optional()
}).strict();

// Validation for importing/exporting data
const importProductRequest = z.object({
  products: z.array(createProductRequest).min(1).max(1000) // Limit batch import size
}).strict();

const exportProductQuery = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  category: z.coerce.number().int().positive().optional(),
  status: inventoryStatusSchema.optional(),
  include_inactive: z.coerce.boolean().default(false)
}).strict();

// Advanced filtering schemas
const advancedProductFilter = z.object({
  name: z.string().optional(),
  sku: z.string().optional(),
  brand: z.string().optional(),
  category_id: idSchema.optional().nullable(),
  inventory_status: inventoryStatusSchema.optional(),
  price_min: z.number().int().min(0).optional(),
  price_max: z.number().int().min(0).optional(),
  has_image: z.boolean().optional(),
  has_sku: z.boolean().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  updated_after: z.string().datetime().optional(),
  updated_before: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  is_active: z.boolean().optional()
}).strict().refine(data => {
  if (data.price_min && data.price_max) {
    return data.price_min <= data.price_max;
  }
  return true;
}, {
  message: "price_min must be less than or equal to price_max"
}).refine(data => {
  if (data.created_after && data.created_before) {
    return new Date(data.created_after) <= new Date(data.created_before);
  }
  return true;
}, {
  message: "created_after must be before created_before"
}).refine(data => {
  if (data.updated_after && data.updated_before) {
    return new Date(data.updated_after) <= new Date(data.updated_before);
  }
  return true;
}, {
  message: "updated_after must be before updated_before"
});

module.exports = {
  // Product schemas
  createProductRequest,
  updateProductRequest,
  bulkUpdateRequest,
  bulkDeleteRequest,
  
  // Category schemas
  createCategoryRequest,
  updateCategoryRequest,
  moveCategoryRequest,
  
  // Query schemas
  productListQuery,
  categoryListQuery,
  paginationQuery,
  productSearchQuery,
  
  // Parameter schemas
  idParam,
  
  // File upload schemas
  fileUploadRequest,
  multipleFileUploadRequest,
  
  // Inventory schemas
  inventoryUpdateRequest,
  bulkInventoryUpdateRequest,
  
  // Import/Export schemas
  importProductRequest,
  exportProductQuery,
  
  // Advanced filtering
  advancedProductFilter
};