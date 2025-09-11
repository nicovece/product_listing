const db = require('../../database/connection');

class ProductManagement {
  static findAll(filters = {}) {
    const {
      page = 1,
      limit = 25,
      category = null,
      status = null,
      search = null,
      sortBy = 'name',
      sortOrder = 'asc'
    } = filters;

    const whereConditions = ['p.is_active = 1'];
    const params = [];

    if (category) {
      whereConditions.push('p.category_id = ?');
      params.push(category);
    }

    if (status) {
      whereConditions.push('p.inventory_status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      whereConditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?) COLLATE NOCASE');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    const validSortFields = ['name', 'price', 'inventory_status', 'created_at', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? `p.${sortBy}` : 'p.name';
    const sortDirection = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';
    
    const orderClause = `ORDER BY ${sortField} ${sortDirection}`;
    const offset = (page - 1) * limit;

    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const products = db.prepare(query).all(...params, limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    
    const { total } = db.prepare(countQuery).get(...params);

    return {
      data: products.map(this.formatProduct),
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: total,
        total_pages: Math.ceil(total / limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1
      }
    };
  }

  static findById(id) {
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_active = 1
    `;
    
    const product = db.prepare(query).get(id);
    return product ? this.formatProduct(product) : null;
  }

  static create(productData) {
    const {
      name,
      description = null,
      sku = null,
      brand = null,
      price,
      category_id = null,
      inventory_status = 'in_stock',
      inventory_count = 0,
      weight_grams = null,
      dimensions_cm = null,
      primary_image_url = null,
      tags = []
    } = productData;

    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([]);
    const dimensionsJson = dimensions_cm ? JSON.stringify(dimensions_cm) : null;

    const query = `
      INSERT INTO products (
        name, description, sku, brand, price, category_id,
        inventory_status, inventory_count, weight_grams, dimensions_cm,
        primary_image_url, tags, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const result = db.prepare(query).run(
      name, description, sku, brand, price, category_id,
      inventory_status, inventory_count, weight_grams, dimensionsJson,
      primary_image_url, tagsJson
    );

    return this.findById(result.lastInsertRowid);
  }

  static update(id, productData) {
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const updateFields = [];
    const params = [];

    const allowedFields = [
      'name', 'description', 'sku', 'brand', 'price', 'category_id',
      'inventory_status', 'inventory_count', 'weight_grams', 'dimensions_cm',
      'primary_image_url', 'tags', 'is_active'
    ];

    allowedFields.forEach(field => {
      if (productData.hasOwnProperty(field)) {
        let value = productData[field];
        
        if (field === 'tags' && Array.isArray(value)) {
          value = JSON.stringify(value);
        } else if (field === 'dimensions_cm' && value && typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        updateFields.push(`${field} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      return existing;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `
      UPDATE products 
      SET ${updateFields.join(', ')} 
      WHERE id = ? AND is_active = 1
    `;

    db.prepare(query).run(...params);
    return this.findById(id);
  }

  static delete(id) {
    const query = `
      UPDATE products 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND is_active = 1
    `;

    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }

  static bulkUpdate(productIds, updates) {
    const updateFields = [];
    const params = [];
    const results = { updated_count: 0, failed_items: [] };

    const allowedFields = ['category_id', 'inventory_status', 'price', 'is_active'];
    
    allowedFields.forEach(field => {
      if (updates.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    });

    if (updateFields.length === 0) {
      return results;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    const placeholders = productIds.map(() => '?').join(',');
    const query = `
      UPDATE products 
      SET ${updateFields.join(', ')} 
      WHERE id IN (${placeholders}) AND is_active = 1
    `;

    try {
      const result = db.prepare(query).run(...params, ...productIds);
      results.updated_count = result.changes;
    } catch (error) {
      productIds.forEach(id => {
        results.failed_items.push({ id, error: error.message });
      });
    }

    return results;
  }

  static bulkDelete(productIds) {
    const results = { deleted_count: 0, failed_items: [] };
    
    const placeholders = productIds.map(() => '?').join(',');
    const query = `
      UPDATE products 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id IN (${placeholders}) AND is_active = 1
    `;

    try {
      const result = db.prepare(query).run(...productIds);
      results.deleted_count = result.changes;
    } catch (error) {
      productIds.forEach(id => {
        results.failed_items.push({ id, error: error.message });
      });
    }

    return results;
  }

  static getInventoryStats() {
    const query = `
      SELECT 
        inventory_status,
        COUNT(*) as count,
        SUM(inventory_count) as total_stock
      FROM products 
      WHERE is_active = 1 
      GROUP BY inventory_status
    `;

    return db.prepare(query).all();
  }

  static formatProduct(product) {
    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      brand: product.brand,
      price: product.price,
      category_id: product.category_id,
      category: product.category_name ? { 
        id: product.category_id, 
        name: product.category_name 
      } : null,
      inventory_status: product.inventory_status,
      inventory_count: product.inventory_count,
      weight_grams: product.weight_grams,
      dimensions_cm: product.dimensions_cm ? JSON.parse(product.dimensions_cm) : null,
      primary_image_url: product.primary_image_url,
      tags: product.tags ? JSON.parse(product.tags) : [],
      is_active: Boolean(product.is_active),
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  }
}

module.exports = ProductManagement;