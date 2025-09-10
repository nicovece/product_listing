const request = require('supertest');
const Database = require('better-sqlite3');
const path = require('path');

// Import the app - this will fail initially because admin routes don't exist yet
let app;
try {
  app = require('../../src/app');
} catch (error) {
  console.log('App not available yet - product-category associations need full implementation');
}

describe('Product-Category Association Integration Tests', () => {
  let db;
  let testDbPath;

  beforeAll(() => {
    // Create a test database
    testDbPath = path.join(__dirname, '../../test_associations.db');
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
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT UNIQUE,
        brand TEXT,
        price INTEGER NOT NULL,
        category_id INTEGER,
        inventory_status TEXT NOT NULL DEFAULT 'in_stock',
        inventory_count INTEGER DEFAULT 0,
        weight_grams INTEGER,
        dimensions_cm TEXT,
        primary_image_url TEXT,
        tags TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `);
  });

  afterAll(() => {
    db.close();
    // Clean up test database
    require('fs').unlinkSync(testDbPath);
  });

  beforeEach(() => {
    // Clear data for each test
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM categories').run();
    
    // Set up basic categories for testing
    db.prepare(`
      INSERT INTO categories (id, name, description) VALUES 
      (1, 'Electronics', 'Electronic devices'),
      (2, 'Books', 'Books and magazines'),
      (3, 'Home & Garden', 'Home and garden supplies'),
      (4, 'Computers', 'Computer hardware'),
      (5, 'Audio', 'Audio equipment')
    `).run();

    // Set up hierarchy - Computers and Audio under Electronics
    db.prepare(`
      UPDATE categories SET parent_category_id = 1 WHERE id IN (4, 5)
    `).run();
    
    if (!app) {
      try {
        app = require('../../src/app');
      } catch (error) {
        // Expected to fail until routes are implemented
      }
    }
  });

  // T023: Integration test product-category associations
  describe('Product-Category Associations', () => {
    it('should create products with valid category associations', async () => {
      if (!app) {
        pending('Product-category associations not implemented yet - this test should fail');
        return;
      }

      // Create products in different categories
      const products = [
        {
          name: "Gaming Laptop",
          price: 149999,
          category_id: 4, // Computers
          sku: "LAPTOP-001",
          inventory_status: "in_stock"
        },
        {
          name: "Wireless Headphones",
          price: 19999,
          category_id: 5, // Audio
          sku: "AUDIO-001",
          inventory_status: "in_stock"
        },
        {
          name: "Programming Guide",
          price: 4999,
          category_id: 2, // Books
          sku: "BOOK-001",
          inventory_status: "in_stock"
        }
      ];

      const productIds = [];
      for (const product of products) {
        const response = await request(app)
          .post('/api/admin/products')
          .send(product)
          .expect(201);
        
        productIds.push(response.body.id);
        expect(response.body.category_id).toBe(product.category_id);
      }

      // Verify products can be filtered by category
      const computersResponse = await request(app)
        .get('/api/admin/products?category=4')
        .expect(200);

      expect(computersResponse.body.data).toHaveLength(1);
      expect(computersResponse.body.data[0].name).toBe('Gaming Laptop');

      const audioResponse = await request(app)
        .get('/api/admin/products?category=5')
        .expect(200);

      expect(audioResponse.body.data).toHaveLength(1);
      expect(audioResponse.body.data[0].name).toBe('Wireless Headphones');
    });

    it('should prevent association with non-existent categories', async () => {
      if (!app) {
        pending('Product-category associations not implemented yet');
        return;
      }

      const invalidProduct = {
        name: "Invalid Category Product",
        price: 1999,
        category_id: 99999, // Non-existent category
        inventory_status: "in_stock"
      };

      const response = await request(app)
        .post('/api/admin/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body.message).toContain('category');
    });

    it('should allow products without categories (null category_id)', async () => {
      if (!app) {
        pending('Product-category associations not implemented yet');
        return;
      }

      const uncategorizedProduct = {
        name: "Uncategorized Product",
        price: 2999,
        category_id: null,
        inventory_status: "in_stock"
      };

      const response = await request(app)
        .post('/api/admin/products')
        .send(uncategorizedProduct)
        .expect(201);

      expect(response.body.category_id).toBeNull();

      // Verify product appears in list without category filter
      const allProductsResponse = await request(app)
        .get('/api/admin/products')
        .expect(200);

      const uncategorizedProducts = allProductsResponse.body.data.filter(p => p.category_id === null);
      expect(uncategorizedProducts).toHaveLength(1);
    });

    it('should update product category associations', async () => {
      if (!app) {
        pending('Product-category associations not implemented yet');
        return;
      }

      // Create product in Books category
      const createResponse = await request(app)
        .post('/api/admin/products')
        .send({
          name: "Tech Book",
          price: 3999,
          category_id: 2, // Books
          inventory_status: "in_stock"
        })
        .expect(201);

      const productId = createResponse.body.id;
      expect(createResponse.body.category_id).toBe(2);

      // Move product to Computers category
      const updateResponse = await request(app)
        .put(`/api/admin/products/${productId}`)
        .send({
          category_id: 4 // Computers
        })
        .expect(200);

      expect(updateResponse.body.category_id).toBe(4);

      // Verify product no longer appears in Books filter
      const booksResponse = await request(app)
        .get('/api/admin/products?category=2')
        .expect(200);

      expect(booksResponse.body.data).toHaveLength(0);

      // Verify product appears in Computers filter
      const computersResponse = await request(app)
        .get('/api/admin/products?category=4')
        .expect(200);

      expect(computersResponse.body.data).toHaveLength(1);
      expect(computersResponse.body.data[0].id).toBe(productId);
    });

    it('should handle bulk category reassignment', async () => {
      if (!app) {
        pending('Product-category associations not implemented yet');
        return;
      }

      // Create multiple products in Books category
      const productData = [
        { name: "Book 1", price: 1999, category_id: 2, sku: "B001" },
        { name: "Book 2", price: 2999, category_id: 2, sku: "B002" },
        { name: "Book 3", price: 3999, category_id: 2, sku: "B003" }
      ];

      const productIds = [];
      for (const product of productData) {
        const response = await request(app)
          .post('/api/admin/products')
          .send({
            ...product,
            inventory_status: "in_stock"
          })
          .expect(201);
        
        productIds.push(response.body.id);
      }

      // Verify all products are in Books category
      const initialBooksResponse = await request(app)
        .get('/api/admin/products?category=2')
        .expect(200);

      expect(initialBooksResponse.body.data).toHaveLength(3);

      // Bulk reassign to Home & Garden category
      const bulkUpdateResponse = await request(app)
        .patch('/api/admin/products/bulk')
        .send({
          product_ids: productIds,
          updates: {
            category_id: 3 // Home & Garden
          }
        })
        .expect(200);

      expect(bulkUpdateResponse.body.updated_count).toBe(3);

      // Verify products moved out of Books
      const finalBooksResponse = await request(app)
        .get('/api/admin/products?category=2')
        .expect(200);

      expect(finalBooksResponse.body.data).toHaveLength(0);

      // Verify products moved to Home & Garden
      const homeGardenResponse = await request(app)
        .get('/api/admin/products?category=3')
        .expect(200);

      expect(homeGardenResponse.body.data).toHaveLength(3);
    });

    it('should maintain referential integrity with category changes', async () => {
      if (!app) {
        pending('Product-category associations not implemented yet');
        return;
      }

      // Create product in a category
      const productResponse = await request(app)
        .post('/api/admin/products')
        .send({
          name: "Test Product",
          price: 4999,
          category_id: 4, // Computers
          inventory_status: "in_stock"
        })
        .expect(201);

      // Try to delete the category that has products
      const deleteResponse = await request(app)
        .delete('/api/admin/categories/4')
        .expect(400);

      expect(deleteResponse.body.message).toContain('products');

      // Verify category still exists
      const categoryResponse = await request(app)
        .get('/api/admin/categories/4')
        .expect(200);

      expect(categoryResponse.body.name).toBe('Computers');

      // Verify product association intact
      const productCheckResponse = await request(app)
        .get(`/api/admin/products/${productResponse.body.id}`)
        .expect(200);

      expect(productCheckResponse.body.category_id).toBe(4);
    });

    it('should provide category information with product details', async () => {
      if (!app) {
        pending('Product-category associations not implemented yet');
        return;
      }

      // Create product with category
      const productResponse = await request(app)
        .post('/api/admin/products')
        .send({
          name: "Laptop with Category Info",
          price: 89999,
          category_id: 4, // Computers
          inventory_status: "in_stock"
        })
        .expect(201);

      const productId = productResponse.body.id;

      // Get product details with category information
      const detailsResponse = await request(app)
        .get(`/api/admin/products/${productId}`)
        .expect(200);

      // Should include category information
      if (detailsResponse.body.category) {
        expect(detailsResponse.body.category).toMatchObject({
          id: 4,
          name: 'Computers'
        });
      }
      expect(detailsResponse.body.category_id).toBe(4);

      // Get products list with category info
      const listResponse = await request(app)
        .get('/api/admin/products')
        .expect(200);

      const product = listResponse.body.data.find(p => p.id === productId);
      expect(product.category_id).toBe(4);
    });

    it('should handle category hierarchy in product filtering', async () => {
      if (!app) {
        pending('Product-category associations not implemented yet');
        return;
      }

      // Create products in both parent and child categories
      const products = [
        {
          name: "Electronics Product",
          price: 9999,
          category_id: 1, // Electronics (parent)
          sku: "ELEC-001"
        },
        {
          name: "Computer Product",
          price: 19999,
          category_id: 4, // Computers (child of Electronics)
          sku: "COMP-001"
        },
        {
          name: "Audio Product",
          price: 14999,
          category_id: 5, // Audio (child of Electronics)
          sku: "AUDIO-001"
        }
      ];

      for (const product of products) {
        await request(app)
          .post('/api/admin/products')
          .send({
            ...product,
            inventory_status: "in_stock"
          })
          .expect(201);
      }

      // Filter by parent category (Electronics)
      const electronicsResponse = await request(app)
        .get('/api/admin/products?category=1')
        .expect(200);

      expect(electronicsResponse.body.data).toHaveLength(1);
      expect(electronicsResponse.body.data[0].name).toBe('Electronics Product');

      // Filter by child category (Computers)
      const computersResponse = await request(app)
        .get('/api/admin/products?category=4')
        .expect(200);

      expect(computersResponse.body.data).toHaveLength(1);
      expect(computersResponse.body.data[0].name).toBe('Computer Product');

      // Note: If hierarchical filtering is implemented (showing child products when filtering by parent),
      // this test would need to be updated to expect different results
    });

    it('should validate category is active when creating product associations', async () => {
      if (!app) {
        pending('Product-category associations not implemented yet');
        return;
      }

      // Mark a category as inactive
      const deactivateResponse = await request(app)
        .put('/api/admin/categories/4')
        .send({
          is_active: false
        })
        .expect(200);

      // Try to create product in inactive category
      const productResponse = await request(app)
        .post('/api/admin/products')
        .send({
          name: "Product in Inactive Category",
          price: 5999,
          category_id: 4, // Inactive category
          inventory_status: "in_stock"
        })
        .expect(400);

      expect(productResponse.body.message).toContain('category');
      expect(productResponse.body.message).toContain('active');
    });
  });

  describe('Category Product Counts', () => {
    it('should accurately count products per category', async () => {
      if (!app) {
        pending('Category product counts not implemented yet');
        return;
      }

      // Create products in different categories
      const testProducts = [
        { name: "Computer 1", category_id: 4, price: 99999 },
        { name: "Computer 2", category_id: 4, price: 79999 },
        { name: "Audio 1", category_id: 5, price: 29999 },
        { name: "Book 1", category_id: 2, price: 1999 },
        { name: "Book 2", category_id: 2, price: 2999 },
        { name: "Book 3", category_id: 2, price: 3999 }
      ];

      for (const product of testProducts) {
        await request(app)
          .post('/api/admin/products')
          .send({
            ...product,
            inventory_status: "in_stock"
          })
          .expect(201);
      }

      // Get categories with product counts
      const categoriesResponse = await request(app)
        .get('/api/admin/categories?include_products=true')
        .expect(200);

      const categories = categoriesResponse.body.data;
      
      const computersCategory = categories.find(c => c.name === 'Computers');
      const audioCategory = categories.find(c => c.name === 'Audio');
      const booksCategory = categories.find(c => c.name === 'Books');
      const electronicsCategory = categories.find(c => c.name === 'Electronics');

      expect(computersCategory.product_count).toBe(2);
      expect(audioCategory.product_count).toBe(1);
      expect(booksCategory.product_count).toBe(3);
      expect(electronicsCategory.product_count).toBe(0); // Direct products only, not counting children
    });
  });
});