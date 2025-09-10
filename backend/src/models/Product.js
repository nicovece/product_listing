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
}

module.exports = Product;