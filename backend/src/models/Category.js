const db = require('../database/connection');

class Category {
  static findAll(options = {}) {
    const { includeProducts = false, activeOnly = true } = options;

    let query = `
      SELECT c.*
      ${includeProducts ? ', COUNT(p.id) as product_count' : ''}
      FROM categories c
      ${includeProducts ? 'LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1' : ''}
      ${activeOnly ? 'WHERE c.is_active = 1' : ''}
      ${includeProducts ? 'GROUP BY c.id' : ''}
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    return db.prepare(query).all();
  }

  static findById(id) {
    const query = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.id = ? AND c.is_active = 1
      GROUP BY c.id
    `;
    
    return db.prepare(query).get(id);
  }

  static findByName(name) {
    const query = 'SELECT * FROM categories WHERE name = ? AND is_active = 1';
    return db.prepare(query).get(name);
  }

  static create(categoryData) {
    const {
      name,
      description = null,
      parent_category_id = null,
      sort_order = 0
    } = categoryData;

    const query = `
      INSERT INTO categories (
        name, description, parent_category_id, sort_order, 
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const result = db.prepare(query).run(name, description, parent_category_id, sort_order);
    return this.findById(result.lastInsertRowid);
  }

  static update(id, categoryData) {
    const updateFields = [];
    const params = [];

    const allowedFields = ['name', 'description', 'parent_category_id', 'sort_order', 'is_active'];

    allowedFields.forEach(field => {
      if (categoryData.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        params.push(categoryData[field]);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `
      UPDATE categories 
      SET ${updateFields.join(', ')} 
      WHERE id = ? AND is_active = 1
    `;

    const result = db.prepare(query).run(...params);
    return result.changes > 0 ? this.findById(id) : null;
  }

  static delete(id) {
    const query = `
      UPDATE categories 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND is_active = 1
    `;

    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }

  static hardDelete(id) {
    const query = 'DELETE FROM categories WHERE id = ?';
    const result = db.prepare(query).run(id);
    return result.changes > 0;
  }

  static findChildren(parentId) {
    const query = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.parent_category_id = ? AND c.is_active = 1
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `;
    
    return db.prepare(query).all(parentId);
  }

  static findAncestors(categoryId) {
    const ancestors = [];
    let currentId = categoryId;

    while (currentId) {
      const query = 'SELECT id, name, parent_category_id FROM categories WHERE id = ? AND is_active = 1';
      const category = db.prepare(query).get(currentId);
      
      if (!category) break;
      
      ancestors.unshift(category);
      currentId = category.parent_category_id;
    }

    return ancestors;
  }

  static findDescendants(categoryId, includeProducts = false) {
    const descendants = [];
    const toProcess = [categoryId];
    const processed = new Set();

    while (toProcess.length > 0) {
      const currentId = toProcess.shift();
      
      if (processed.has(currentId)) continue;
      processed.add(currentId);

      const children = this.findChildren(currentId);
      descendants.push(...children);
      
      toProcess.push(...children.map(child => child.id));
    }

    return descendants;
  }

  static getHierarchy() {
    const query = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    const categories = db.prepare(query).all();
    return this.buildHierarchy(categories);
  }

  static buildHierarchy(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
      if (!category.parent_category_id) {
        rootCategories.push(categoryMap.get(category.id));
      }
    });

    categories.forEach(category => {
      if (category.parent_category_id) {
        const parent = categoryMap.get(category.parent_category_id);
        if (parent) {
          parent.children.push(categoryMap.get(category.id));
        }
      }
    });

    return rootCategories;
  }

  static validateHierarchy(categoryId, newParentId) {
    if (!newParentId) return true;
    if (categoryId === newParentId) return false;

    const descendants = this.findDescendants(categoryId);
    return !descendants.some(desc => desc.id === newParentId);
  }

  static getProductCount(categoryId, includeDescendants = false) {
    if (!includeDescendants) {
      const query = 'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1';
      const result = db.prepare(query).get(categoryId);
      return result.count;
    }

    const descendants = this.findDescendants(categoryId);
    const allCategoryIds = [categoryId, ...descendants.map(d => d.id)];
    
    const placeholders = allCategoryIds.map(() => '?').join(',');
    const query = `SELECT COUNT(*) as count FROM products WHERE category_id IN (${placeholders}) AND is_active = 1`;
    
    const result = db.prepare(query).get(...allCategoryIds);
    return result.count;
  }

  static reorderCategories(categoryId, newSortOrder) {
    const category = this.findById(categoryId);
    if (!category) return false;

    const parentId = category.parent_category_id;
    
    // Get all siblings
    const siblingsQuery = `
      SELECT id, sort_order 
      FROM categories 
      WHERE parent_category_id ${parentId ? '= ?' : 'IS NULL'} 
      AND is_active = 1 
      AND id != ?
      ORDER BY sort_order ASC
    `;
    
    const params = parentId ? [parentId, categoryId] : [categoryId];
    const siblings = db.prepare(siblingsQuery).all(...params);

    // Update sort orders
    const transaction = db.transaction(() => {
      // First, update the target category
      this.update(categoryId, { sort_order: newSortOrder });

      // Then, adjust siblings
      siblings.forEach((sibling, index) => {
        const adjustedOrder = index >= newSortOrder ? index + 1 : index;
        if (sibling.sort_order !== adjustedOrder) {
          this.update(sibling.id, { sort_order: adjustedOrder });
        }
      });
    });

    try {
      transaction();
      return true;
    } catch (error) {
      console.error('Error reordering categories:', error);
      return false;
    }
  }

  static moveCategory(categoryId, newParentId, newSortOrder = null) {
    if (!this.validateHierarchy(categoryId, newParentId)) {
      throw new Error('Cannot create circular reference in category hierarchy');
    }

    const updateData = { parent_category_id: newParentId };
    if (newSortOrder !== null) {
      updateData.sort_order = newSortOrder;
    }

    return this.update(categoryId, updateData);
  }

  static searchByName(searchTerm, includeProducts = false) {
    let query = `
      SELECT c.*
      ${includeProducts ? ', COUNT(p.id) as product_count' : ''}
      FROM categories c
      ${includeProducts ? 'LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1' : ''}
      WHERE c.name LIKE ? COLLATE NOCASE AND c.is_active = 1
      ${includeProducts ? 'GROUP BY c.id' : ''}
      ORDER BY c.name ASC
    `;

    return db.prepare(query).all(`%${searchTerm}%`);
  }

  static findRootCategories() {
    const query = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.parent_category_id IS NULL AND c.is_active = 1
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    return db.prepare(query).all();
  }

  static findLeafCategories() {
    const query = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.is_active = 1 
      AND c.id NOT IN (
        SELECT DISTINCT parent_category_id 
        FROM categories 
        WHERE parent_category_id IS NOT NULL AND is_active = 1
      )
      GROUP BY c.id
      ORDER BY c.name ASC
    `;

    return db.prepare(query).all();
  }

  static getStatistics() {
    const totalQuery = 'SELECT COUNT(*) as total FROM categories WHERE is_active = 1';
    const rootQuery = 'SELECT COUNT(*) as root FROM categories WHERE parent_category_id IS NULL AND is_active = 1';
    const withProductsQuery = `
      SELECT COUNT(DISTINCT c.id) as with_products 
      FROM categories c 
      INNER JOIN products p ON c.id = p.category_id 
      WHERE c.is_active = 1 AND p.is_active = 1
    `;

    const total = db.prepare(totalQuery).get();
    const root = db.prepare(rootQuery).get();
    const withProducts = db.prepare(withProductsQuery).get();

    return {
      total_categories: total.total,
      root_categories: root.root,
      categories_with_products: withProducts.with_products,
      empty_categories: total.total - withProducts.with_products
    };
  }

  static count() {
    const query = 'SELECT COUNT(*) as total FROM categories WHERE is_active = 1';
    const { total } = db.prepare(query).get();
    return total;
  }
}

module.exports = Category;