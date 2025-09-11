const db = require('../../database/connection');

class CategoryManagement {
  static findAll(options = {}) {
    const { includeProducts = false } = options;

    let query = `
      SELECT c.*
      ${includeProducts ? ', COUNT(p.id) as product_count' : ''}
      FROM categories c
      ${includeProducts ? 'LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1' : ''}
      WHERE c.is_active = 1
      ${includeProducts ? 'GROUP BY c.id' : ''}
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    const categories = db.prepare(query).all();
    return {
      data: categories.map(this.formatCategory)
    };
  }

  static findById(id) {
    const query = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.id = ? AND c.is_active = 1
      GROUP BY c.id
    `;
    
    const category = db.prepare(query).get(id);
    return category ? this.formatCategory(category) : null;
  }

  static create(categoryData) {
    const {
      name,
      description = null,
      parent_category_id = null,
      sort_order = 0
    } = categoryData;

    // Check for circular reference
    if (parent_category_id && this.wouldCreateCircularReference(null, parent_category_id)) {
      throw new Error('Cannot create circular category reference');
    }

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
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const updateFields = [];
    const params = [];

    const allowedFields = ['name', 'description', 'parent_category_id', 'sort_order', 'is_active'];

    allowedFields.forEach(field => {
      if (categoryData.hasOwnProperty(field)) {
        const value = categoryData[field];
        
        // Check for circular reference on parent_category_id update
        if (field === 'parent_category_id' && value && this.wouldCreateCircularReference(id, value)) {
          throw new Error('Cannot create circular category reference');
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
      UPDATE categories 
      SET ${updateFields.join(', ')} 
      WHERE id = ? AND is_active = 1
    `;

    db.prepare(query).run(...params);
    return this.findById(id);
  }

  static delete(id) {
    // Check if category has products
    const productCountQuery = 'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1';
    const { count } = db.prepare(productCountQuery).get(id);
    
    if (count > 0) {
      throw new Error('Cannot delete category with active products');
    }

    // Check if category has child categories
    const childCountQuery = 'SELECT COUNT(*) as count FROM categories WHERE parent_category_id = ? AND is_active = 1';
    const { count: childCount } = db.prepare(childCountQuery).get(id);
    
    if (childCount > 0) {
      throw new Error('Cannot delete category with child categories');
    }

    const query = `
      UPDATE categories 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND is_active = 1
    `;

    const result = db.prepare(query).run(id);
    return result.changes > 0;
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
    return this.buildHierarchy(categories.map(this.formatCategory));
  }

  static buildHierarchy(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: create map and identify root categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
      if (!category.parent_category_id) {
        rootCategories.push(categoryMap.get(category.id));
      }
    });

    // Second pass: build parent-child relationships
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

  static getCategoryPath(categoryId) {
    const path = [];
    let currentId = categoryId;

    while (currentId) {
      const query = 'SELECT id, name, parent_category_id FROM categories WHERE id = ? AND is_active = 1';
      const category = db.prepare(query).get(currentId);
      
      if (!category) break;
      
      path.unshift({ id: category.id, name: category.name });
      currentId = category.parent_category_id;
    }

    return path;
  }

  static wouldCreateCircularReference(categoryId, parentId) {
    if (!parentId || categoryId === parentId) {
      return categoryId === parentId;
    }

    // Follow the parent chain upward to check for circular reference
    let currentParentId = parentId;
    const visited = new Set();

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        return true; // Circular reference detected
      }
      
      if (currentParentId === categoryId) {
        return true; // Would create circular reference
      }

      visited.add(currentParentId);
      
      const query = 'SELECT parent_category_id FROM categories WHERE id = ? AND is_active = 1';
      const result = db.prepare(query).get(currentParentId);
      currentParentId = result ? result.parent_category_id : null;
    }

    return false;
  }

  static getChildCategories(parentId, includeProducts = false) {
    let query = `
      SELECT c.*
      ${includeProducts ? ', COUNT(p.id) as product_count' : ''}
      FROM categories c
      ${includeProducts ? 'LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1' : ''}
      WHERE c.parent_category_id = ? AND c.is_active = 1
      ${includeProducts ? 'GROUP BY c.id' : ''}
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    const categories = db.prepare(query).all(parentId);
    return categories.map(this.formatCategory);
  }

  static moveCategory(categoryId, newParentId, newSortOrder = null) {
    if (newParentId && this.wouldCreateCircularReference(categoryId, newParentId)) {
      throw new Error('Cannot create circular category reference');
    }

    const updateData = { parent_category_id: newParentId };
    if (newSortOrder !== null) {
      updateData.sort_order = newSortOrder;
    }

    return this.update(categoryId, updateData);
  }

  static formatCategory(category) {
    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      parent_category_id: category.parent_category_id,
      sort_order: category.sort_order,
      is_active: Boolean(category.is_active),
      product_count: category.product_count || 0,
      created_at: category.created_at,
      updated_at: category.updated_at
    };
  }
}

module.exports = CategoryManagement;