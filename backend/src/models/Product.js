const db = require('../database/connection');

class Product {
  static findAll({ 
    page = 1, 
    limit = 25, 
    priceMin = null, 
    priceMax = null, 
    searchText = '', 
    sortBy = 'name', 
    sortOrder = 'asc' 
  } = {}) {
    
    // Build WHERE clause for filtering
    const whereConditions = [];
    const params = [];

    if (priceMin !== null) {
      whereConditions.push('price >= ?');
      params.push(priceMin);
    }

    if (priceMax !== null) {
      whereConditions.push('price <= ?');
      params.push(priceMax);
    }

    if (searchText && searchText.trim()) {
      whereConditions.push('name LIKE ? COLLATE NOCASE');
      params.push(`%${searchText.trim()}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Build ORDER BY clause
    const validSortFields = ['name', 'price', 'likes'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) {
      sortBy = 'name';
    }
    if (!validSortOrders.includes(sortOrder.toLowerCase())) {
      sortOrder = 'asc';
    }

    const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Query for products
    const query = `
      SELECT id, name, price, likes, imageUrl 
      FROM products 
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const products = db.prepare(query).all(...params, limit, offset);

    // Query for total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products 
      ${whereClause}
    `;

    const { total } = db.prepare(countQuery).get(...params);

    return {
      products,
      totalItems: total,
      currentPage: page,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  static findById(id) {
    const query = 'SELECT id, name, price, likes, imageUrl FROM products WHERE id = ?';
    return db.prepare(query).get(id);
  }

  static count() {
    const query = 'SELECT COUNT(*) as total FROM products';
    const { total } = db.prepare(query).get();
    return total;
  }

  // Admin methods for comprehensive product management
  static findAllAdmin(filters = {}) {
    const {
      page = 1,
      limit = 25,
      category = null,
      status = null,
      search = null,
      sortBy = 'name',
      sortOrder = 'asc',
      includeInactive = false
    } = filters;

    const whereConditions = [];
    const params = [];

    if (!includeInactive) {
      whereConditions.push('p.is_active = 1');
    }

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

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const validSortFields = ['name', 'price', 'inventory_status', 'created_at', 'updated_at', 'sku', 'brand'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const sortDirection = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';
    
    const orderClause = `ORDER BY p.${sortField} ${sortDirection}`;
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
      data: products.map(this.formatProductAdmin),
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

  static findByIdAdmin(id) {
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    
    const product = db.prepare(query).get(id);
    return product ? this.formatProductAdmin(product) : null;
  }

  static createAdmin(productData) {
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
      tags = [],
      likes = 0,
      imageUrl = null
    } = productData;

    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([]);
    const dimensionsJson = dimensions_cm ? JSON.stringify(dimensions_cm) : null;

    const query = `
      INSERT INTO products (
        name, description, sku, brand, price, category_id,
        inventory_status, inventory_count, weight_grams, dimensions_cm,
        primary_image_url, tags, likes, imageUrl, is_active, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const result = db.prepare(query).run(
      name, description, sku, brand, price, category_id,
      inventory_status, inventory_count, weight_grams, dimensionsJson,
      primary_image_url, tagsJson, likes, imageUrl || primary_image_url
    );

    return this.findByIdAdmin(result.lastInsertRowid);
  }

  static updateAdmin(id, productData) {
    const existing = this.findByIdAdmin(id);
    if (!existing) {
      return null;
    }

    const updateFields = [];
    const params = [];

    const allowedFields = [
      'name', 'description', 'sku', 'brand', 'price', 'category_id',
      'inventory_status', 'inventory_count', 'weight_grams', 'dimensions_cm',
      'primary_image_url', 'tags', 'is_active', 'likes', 'imageUrl'
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
      WHERE id = ?
    `;

    db.prepare(query).run(...params);
    return this.findByIdAdmin(id);
  }

  static deleteAdmin(id) {
    const query = `
      UPDATE products 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }

  static restoreAdmin(id) {
    const query = `
      UPDATE products 
      SET is_active = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }

  static hardDeleteAdmin(id) {
    const query = 'DELETE FROM products WHERE id = ?';
    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }

  static bulkUpdateAdmin(productIds, updates) {
    const updateFields = [];
    const params = [];
    const results = { updated_count: 0, failed_items: [] };

    const allowedFields = ['category_id', 'inventory_status', 'price', 'is_active', 'brand'];
    
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
      WHERE id IN (${placeholders})
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

  static bulkDeleteAdmin(productIds) {
    const results = { deleted_count: 0, failed_items: [] };
    
    const placeholders = productIds.map(() => '?').join(',');
    const query = `
      UPDATE products 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id IN (${placeholders})
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
        SUM(inventory_count) as total_stock,
        AVG(price) as avg_price
      FROM products 
      WHERE is_active = 1 
      GROUP BY inventory_status
    `;

    return db.prepare(query).all();
  }

  static getLowStockProducts(threshold = 5) {
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 
      AND (p.inventory_status = 'low_stock' OR p.inventory_count <= ?)
      ORDER BY p.inventory_count ASC, p.name ASC
    `;

    return db.prepare(query).all(threshold).map(this.formatProductAdmin);
  }

  static searchAdmin(searchTerm, filters = {}) {
    const {
      category = null,
      status = null,
      priceMin = null,
      priceMax = null,
      hasImage = null,
      hasSku = null
    } = filters;

    const whereConditions = ['p.is_active = 1'];
    const params = [];

    if (searchTerm && searchTerm.trim()) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?) COLLATE NOCASE');
      const searchPattern = `%${searchTerm.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (category) {
      whereConditions.push('p.category_id = ?');
      params.push(category);
    }

    if (status) {
      whereConditions.push('p.inventory_status = ?');
      params.push(status);
    }

    if (priceMin !== null) {
      whereConditions.push('p.price >= ?');
      params.push(priceMin);
    }

    if (priceMax !== null) {
      whereConditions.push('p.price <= ?');
      params.push(priceMax);
    }

    if (hasImage === true) {
      whereConditions.push('(p.primary_image_url IS NOT NULL OR p.imageUrl IS NOT NULL)');
    } else if (hasImage === false) {
      whereConditions.push('(p.primary_image_url IS NULL AND p.imageUrl IS NULL)');
    }

    if (hasSku === true) {
      whereConditions.push('p.sku IS NOT NULL');
    } else if (hasSku === false) {
      whereConditions.push('p.sku IS NULL');
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.name ASC
    `;

    return db.prepare(query).all(...params).map(this.formatProductAdmin);
  }

  static getProductsByCategory(categoryId, includeInactive = false) {
    const activeClause = includeInactive ? '' : 'AND p.is_active = 1';
    
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? ${activeClause}
      ORDER BY p.name ASC
    `;

    return db.prepare(query).all(categoryId).map(this.formatProductAdmin);
  }

  static updateInventoryStatus(id, status, count = null) {
    const updates = { inventory_status: status };
    if (count !== null) {
      updates.inventory_count = count;
    }

    return this.updateAdmin(id, updates);
  }

  static formatProductAdmin(product) {
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
      inventory_status: product.inventory_status || 'in_stock',
      inventory_count: product.inventory_count || 0,
      weight_grams: product.weight_grams,
      dimensions_cm: product.dimensions_cm ? JSON.parse(product.dimensions_cm) : null,
      primary_image_url: product.primary_image_url,
      tags: product.tags ? JSON.parse(product.tags) : [],
      likes: product.likes || 0,
      imageUrl: product.imageUrl,
      is_active: Boolean(product.is_active !== undefined ? product.is_active : true),
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  }
}

module.exports = Product;