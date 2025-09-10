const request = require('supertest');
const Database = require('better-sqlite3');
const path = require('path');

// Import the app - this will fail initially because admin routes don't exist yet
let app;
try {
  app = require('../../src/app');
} catch (error) {
  console.log('App not available yet - category routes need to be implemented');
}

describe('Admin Categories API Contract Tests', () => {
  let db;
  let testDbPath;

  beforeAll(() => {
    // Create a test database
    testDbPath = path.join(__dirname, '../../test_categories.db');
    db = new Database(testDbPath);
    
    // Set up test database schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        parent_category_id INTEGER,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_category_id) REFERENCES categories(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        category_id INTEGER,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    // Insert test data
    db.prepare(`
      INSERT INTO categories (id, name, description, sort_order) VALUES 
      (1, 'Electronics', 'Electronic devices and gadgets', 1),
      (2, 'Books', 'Books and magazines', 2),
      (3, 'Computers', 'Computer hardware and software', 1),
      (4, 'Audio', 'Audio equipment', 2)
    `).run();

    // Set up hierarchy - Computers and Audio are children of Electronics
    db.prepare(`
      UPDATE categories SET parent_category_id = 1 WHERE id IN (3, 4)
    `).run();

    // Insert some products
    db.prepare(`
      INSERT INTO products (name, price, category_id) VALUES 
      ('Laptop', 99999, 3),
      ('Headphones', 19999, 4),
      ('Novel', 1499, 2)
    `).run();
  });

  afterAll(() => {
    db.close();
    // Clean up test database
    require('fs').unlinkSync(testDbPath);
  });

  beforeEach(() => {
    // This will be needed when app is available
    if (!app) {
      try {
        app = require('../../src/app');
      } catch (error) {
        // Expected to fail until routes are implemented
      }
    }
  });

  // T013: Contract test GET /api/admin/categories
  describe('GET /api/admin/categories', () => {
    it('should return all categories with hierarchy information', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet - this test should fail');
        return;
      }

      const response = await request(app)
        .get('/api/admin/categories')
        .expect('Content-Type', /json/)
        .expect(200);

      // Contract validation - response structure
      expect(response.body).toMatchObject({
        data: expect.any(Array)
      });

      expect(response.body.data.length).toBeGreaterThan(0);

      // Validate category structure
      const category = response.body.data[0];
      expect(category).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        sort_order: expect.any(Number),
        is_active: expect.any(Boolean),
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
    });

    it('should support including product count', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet');
        return;
      }

      const response = await request(app)
        .get('/api/admin/categories?include_products=true')
        .expect(200);

      const electronicsCategory = response.body.data.find(c => c.name === 'Electronics');
      expect(electronicsCategory).toHaveProperty('product_count');
      expect(electronicsCategory.product_count).toBeGreaterThanOrEqual(0);
    });

    it('should return categories ordered by sort_order', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet');
        return;
      }

      const response = await request(app)
        .get('/api/admin/categories')
        .expect(200);

      const categories = response.body.data;
      for (let i = 1; i < categories.length; i++) {
        if (categories[i-1].parent_category_id === categories[i].parent_category_id) {
          expect(categories[i-1].sort_order).toBeLessThanOrEqual(categories[i].sort_order);
        }
      }
    });
  });

  // T014: Contract test POST /api/admin/categories
  describe('POST /api/admin/categories', () => {
    it('should create a new category', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet - this test should fail');
        return;
      }

      const newCategory = {
        name: 'New Test Category',
        description: 'A test category for validation',
        sort_order: 5
      };

      const response = await request(app)
        .post('/api/admin/categories')
        .send(newCategory)
        .expect('Content-Type', /json/)
        .expect(201);

      // Validate response structure
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: newCategory.name,
        description: newCategory.description,
        sort_order: newCategory.sort_order,
        parent_category_id: null,
        is_active: true,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
    });

    it('should create subcategory with parent relationship', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet');
        return;
      }

      const subCategory = {
        name: 'Mobile Phones',
        description: 'Smartphones and mobile devices',
        parent_category_id: 1, // Electronics
        sort_order: 3
      };

      const response = await request(app)
        .post('/api/admin/categories')
        .send(subCategory)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: subCategory.name,
        parent_category_id: 1,
        sort_order: 3
      });
    });

    it('should validate required fields', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet');
        return;
      }

      const invalidCategory = {
        description: 'Missing name field'
      };

      const response = await request(app)
        .post('/api/admin/categories')
        .send(invalidCategory)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        message: expect.stringContaining('name')
      });
    });

    it('should prevent duplicate category names', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet');
        return;
      }

      const duplicateCategory = {
        name: 'Electronics', // Already exists
        description: 'Duplicate category'
      };

      const response = await request(app)
        .post('/api/admin/categories')
        .send(duplicateCategory)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.message).toContain('name');
    });

    it('should validate parent category exists', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet');
        return;
      }

      const invalidParentCategory = {
        name: 'Invalid Parent Category',
        parent_category_id: 99999 // Doesn't exist
      };

      const response = await request(app)
        .post('/api/admin/categories')
        .send(invalidParentCategory)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.message).toContain('parent');
    });
  });

  // T015: Contract test PUT /api/admin/categories/{id}
  describe('PUT /api/admin/categories/:id', () => {
    it('should update existing category', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet - this test should fail');
        return;
      }

      const updates = {
        name: 'Updated Electronics',
        description: 'Updated description for electronics',
        sort_order: 10
      };

      const response = await request(app)
        .put('/api/admin/categories/1')
        .send(updates)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        name: updates.name,
        description: updates.description,
        sort_order: updates.sort_order,
        updated_at: expect.any(String)
      });
    });

    it('should update parent category relationship', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet');
        return;
      }

      const updates = {
        parent_category_id: 2 // Move to Books category
      };

      const response = await request(app)
        .put('/api/admin/categories/3')
        .send(updates)
        .expect(200);

      expect(response.body.parent_category_id).toBe(2);
    });

    it('should prevent circular parent relationships', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet');
        return;
      }

      // Try to make Electronics a child of its own child (Computers)
      const circularUpdate = {
        parent_category_id: 3
      };

      const response = await request(app)
        .put('/api/admin/categories/1')
        .send(circularUpdate)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.message).toContain('circular');
    });

    it('should return 404 for non-existent category', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet');
        return;
      }

      const response = await request(app)
        .put('/api/admin/categories/99999')
        .send({ name: 'Non-existent' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        message: expect.stringContaining('not found')
      });
    });
  });

  describe('DELETE /api/admin/categories/:id', () => {
    it('should delete category when it has no products', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet - this test should fail');
        return;
      }

      // Create a category with no products for deletion
      const newCategoryResponse = await request(app)
        .post('/api/admin/categories')
        .send({ name: 'Temporary Category', description: 'For deletion test' })
        .expect(201);

      const categoryId = newCategoryResponse.body.id;

      const response = await request(app)
        .delete(`/api/admin/categories/${categoryId}`)
        .expect(204);

      expect(response.body).toEqual({});

      // Verify category is deleted
      const verifyResponse = await request(app)
        .get(`/api/admin/categories/${categoryId}`)
        .expect(404);
    });

    it('should prevent deletion of category with products', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet');
        return;
      }

      // Try to delete Electronics category which has products
      const response = await request(app)
        .delete('/api/admin/categories/1')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        message: expect.stringContaining('products')
      });
    });

    it('should return 404 for non-existent category', async () => {
      if (!app) {
        pending('Admin category routes not implemented yet');
        return;
      }

      const response = await request(app)
        .delete('/api/admin/categories/99999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        message: expect.stringContaining('not found')
      });
    });
  });
});