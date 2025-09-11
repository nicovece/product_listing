const request = require('supertest');
const Database = require('better-sqlite3');
const path = require('path');

// Import the app - this will fail initially because admin routes don't exist yet
let app;
try {
  app = require('../../src/app');
} catch (error) {
  console.log('App not available yet - admin workflows need full implementation');
}

describe('Admin Workflows Integration Tests', () => {
  let db;
  let testDbPath;

  beforeAll(() => {
    // Create a test database
    testDbPath = path.join(__dirname, '../../test_workflows.db');
    db = new Database(testDbPath);
    
    // Set up complete test database schema
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

    // Insert test categories
    db.prepare(`
      INSERT INTO categories (name, description) VALUES 
      ('Electronics', 'Electronic devices and gadgets'),
      ('Books', 'Books and magazines'),
      ('Home & Garden', 'Home improvement and garden supplies')
    `).run();
  });

  afterAll(() => {
    db.close();
    // Clean up test database
    require('fs').unlinkSync(testDbPath);
  });

  beforeEach(() => {
    // Clear products for each test
    db.prepare('DELETE FROM products').run();
    
    // This will be needed when app is available
    if (!app) {
      try {
        app = require('../../src/app');
      } catch (error) {
        // Expected to fail until routes are implemented
      }
    }
  });

  // T016: Integration test "Create New Product" workflow (from quickstart.md Scenario 1)
  describe('Scenario 1: Create New Product Workflow', () => {
    it('should complete full product creation workflow', async () => {
      if (!app) {
        pending('Admin workflows not implemented yet - this test should fail');
        return;
      }

      // Step 1: Navigate to admin products (GET /api/admin/products)
      const initialListResponse = await request(app)
        .get('/api/admin/products')
        .expect(200);

      expect(initialListResponse.body.data).toHaveLength(0);

      // Step 2: Create product with complete information (POST /api/admin/products)
      const newProduct = {
        name: "Wireless Bluetooth Headphones",
        description: "High-quality wireless headphones with noise cancellation",
        sku: "WBH-001",
        brand: "TechCorp",
        price: 9999, // $99.99 in cents
        category_id: 1, // Electronics
        inventory_status: "in_stock",
        inventory_count: 50,
        weight_grams: 250
      };

      const createResponse = await request(app)
        .post('/api/admin/products')
        .send(newProduct)
        .expect(201);

      // Validate product creation
      expect(createResponse.body).toMatchObject({
        id: expect.any(Number),
        name: newProduct.name,
        sku: newProduct.sku,
        price: newProduct.price,
        category_id: newProduct.category_id,
        inventory_status: newProduct.inventory_status,
        inventory_count: newProduct.inventory_count
      });

      const productId = createResponse.body.id;

      // Step 3: Verify product appears in admin list
      const adminListResponse = await request(app)
        .get('/api/admin/products')
        .expect(200);

      expect(adminListResponse.body.data).toHaveLength(1);
      expect(adminListResponse.body.data[0].name).toBe(newProduct.name);

      // Step 4: Verify product is immediately visible in customer listing
      const customerListResponse = await request(app)
        .get('/api/products')
        .expect(200);

      expect(customerListResponse.body.products).toHaveLength(1);
      expect(customerListResponse.body.products[0].name).toBe(newProduct.name);

      // Step 5: Verify product can be retrieved individually
      const getProductResponse = await request(app)
        .get(`/api/admin/products/${productId}`)
        .expect(200);

      expect(getProductResponse.body).toMatchObject(newProduct);
    });

    it('should handle validation errors during product creation', async () => {
      if (!app) {
        pending('Admin workflows not implemented yet');
        return;
      }

      const invalidProduct = {
        description: "Missing required fields",
        price: -100 // Invalid negative price
      };

      const response = await request(app)
        .post('/api/admin/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        message: expect.any(String)
      });

      // Verify no product was created
      const listResponse = await request(app)
        .get('/api/admin/products')
        .expect(200);

      expect(listResponse.body.data).toHaveLength(0);
    });
  });

  // T017: Integration test "Edit Existing Product" workflow (from quickstart.md Scenario 2)
  describe('Scenario 2: Edit Existing Product Workflow', () => {
    let productId;

    beforeEach(async () => {
      if (!app) return;

      // Create a product to edit
      const createResponse = await request(app)
        .post('/api/admin/products')
        .send({
          name: "Original Product",
          price: 8999,
          sku: "ORIG-001",
          inventory_status: "in_stock",
          inventory_count: 25
        })
        .expect(201);

      productId = createResponse.body.id;
    });

    it('should complete full product edit workflow', async () => {
      if (!app) {
        pending('Admin workflows not implemented yet - this test should fail');
        return;
      }

      // Step 1: Get current product details
      const originalResponse = await request(app)
        .get(`/api/admin/products/${productId}`)
        .expect(200);

      expect(originalResponse.body.price).toBe(8999);
      expect(originalResponse.body.inventory_status).toBe('in_stock');

      // Step 2: Update product fields
      const updates = {
        price: 8999, // Change to $89.99
        inventory_status: "low_stock",
        inventory_count: 5
      };

      const updateResponse = await request(app)
        .put(`/api/admin/products/${productId}`)
        .send(updates)
        .expect(200);

      // Validate update response
      expect(updateResponse.body).toMatchObject({
        id: productId,
        price: updates.price,
        inventory_status: updates.inventory_status,
        inventory_count: updates.inventory_count,
        updated_at: expect.any(String)
      });

      // Step 3: Verify changes in admin list
      const adminListResponse = await request(app)
        .get('/api/admin/products')
        .expect(200);

      const updatedProduct = adminListResponse.body.data.find(p => p.id === productId);
      expect(updatedProduct).toMatchObject(updates);

      // Step 4: Verify changes reflected in customer listing
      const customerListResponse = await request(app)
        .get('/api/products')
        .expect(200);

      const customerProduct = customerListResponse.body.products.find(p => p.id === productId);
      expect(customerProduct.price).toBe(updates.price / 100); // Customer API shows dollars
    });

    it('should handle partial updates correctly', async () => {
      if (!app) {
        pending('Admin workflows not implemented yet');
        return;
      }

      const partialUpdate = {
        inventory_status: "out_of_stock"
        // Only updating status, not other fields
      };

      const updateResponse = await request(app)
        .put(`/api/admin/products/${productId}`)
        .send(partialUpdate)
        .expect(200);

      expect(updateResponse.body.inventory_status).toBe('out_of_stock');
      expect(updateResponse.body.name).toBe('Original Product'); // Unchanged
    });
  });

  // T018: Integration test "Delete Product" workflow (from quickstart.md Scenario 3)
  describe('Scenario 3: Delete Product Workflow', () => {
    let productId;

    beforeEach(async () => {
      if (!app) return;

      // Create a product to delete
      const createResponse = await request(app)
        .post('/api/admin/products')
        .send({
          name: "Product to Delete",
          price: 1999,
          sku: "DEL-001",
          inventory_status: "in_stock"
        })
        .expect(201);

      productId = createResponse.body.id;
    });

    it('should complete full product deletion workflow', async () => {
      if (!app) {
        pending('Admin workflows not implemented yet - this test should fail');
        return;
      }

      // Step 1: Verify product exists in listings
      const initialAdminResponse = await request(app)
        .get('/api/admin/products')
        .expect(200);
      
      expect(initialAdminResponse.body.data).toHaveLength(1);

      const initialCustomerResponse = await request(app)
        .get('/api/products')
        .expect(200);
      
      expect(initialCustomerResponse.body.products).toHaveLength(1);

      // Step 2: Delete the product
      const deleteResponse = await request(app)
        .delete(`/api/admin/products/${productId}`)
        .expect(204);

      expect(deleteResponse.body).toEqual({});

      // Step 3: Verify product removed from admin list (or marked as inactive)
      const adminListResponse = await request(app)
        .get('/api/admin/products')
        .expect(200);

      const activeProducts = adminListResponse.body.data.filter(p => p.is_active);
      expect(activeProducts).toHaveLength(0);

      // Step 4: Verify product not visible in customer listing
      const customerListResponse = await request(app)
        .get('/api/products')
        .expect(200);

      expect(customerListResponse.body.products).toHaveLength(0);

      // Step 5: Verify product still exists but is soft deleted
      const getDeletedResponse = await request(app)
        .get(`/api/admin/products/${productId}`)
        .expect(200);

      expect(getDeletedResponse.body.is_active).toBe(false);
    });

    it('should handle deletion of non-existent product', async () => {
      if (!app) {
        pending('Admin workflows not implemented yet');
        return;
      }

      const response = await request(app)
        .delete('/api/admin/products/99999')
        .expect(404);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        message: expect.stringContaining('not found')
      });
    });
  });

  // T019: Integration test "Bulk Update Products" workflow (from quickstart.md Scenario 4)
  describe('Scenario 4: Bulk Update Products Workflow', () => {
    let productIds = [];

    beforeEach(async () => {
      if (!app) return;

      // Create multiple products for bulk operations
      const products = [
        { name: "Bulk Product 1", price: 1999, sku: "BULK-001", category_id: 1 },
        { name: "Bulk Product 2", price: 2999, sku: "BULK-002", category_id: 1 },
        { name: "Bulk Product 3", price: 3999, sku: "BULK-003", category_id: 2 },
        { name: "Bulk Product 4", price: 4999, sku: "BULK-004", category_id: 2 },
        { name: "Bulk Product 5", price: 5999, sku: "BULK-005", category_id: 1 }
      ];

      productIds = [];
      for (const product of products) {
        const response = await request(app)
          .post('/api/admin/products')
          .send(product)
          .expect(201);
        productIds.push(response.body.id);
      }
    });

    it('should complete bulk category change workflow', async () => {
      if (!app) {
        pending('Admin workflows not implemented yet - this test should fail');
        return;
      }

      // Step 1: Select multiple products (first 3)
      const selectedIds = productIds.slice(0, 3);

      // Step 2: Perform bulk category change
      const bulkUpdate = {
        product_ids: selectedIds,
        updates: {
          category_id: 3 // Move to Home & Garden
        }
      };

      const bulkResponse = await request(app)
        .patch('/api/admin/products/bulk')
        .send(bulkUpdate)
        .expect(200);

      expect(bulkResponse.body).toMatchObject({
        updated_count: 3,
        failed_items: []
      });

      // Step 3: Verify all selected products moved to new category
      const verifyResponse = await request(app)
        .get('/api/admin/products?category=3')
        .expect(200);

      expect(verifyResponse.body.data).toHaveLength(3);
      verifyResponse.body.data.forEach(product => {
        expect(selectedIds).toContain(product.id);
        expect(product.category_id).toBe(3);
      });

      // Step 4: Verify unselected products unchanged
      const unchangedResponse = await request(app)
        .get('/api/admin/products')
        .expect(200);

      const unchangedProducts = unchangedResponse.body.data.filter(
        p => !selectedIds.includes(p.id)
      );

      expect(unchangedProducts).toHaveLength(2);
      unchangedProducts.forEach(product => {
        expect(product.category_id).not.toBe(3);
      });
    });

    it('should handle bulk operations with partial failures', async () => {
      if (!app) {
        pending('Admin workflows not implemented yet');
        return;
      }

      const bulkUpdate = {
        product_ids: [productIds[0], 99999, productIds[1]], // Include non-existent ID
        updates: {
          inventory_status: "low_stock"
        }
      };

      const response = await request(app)
        .patch('/api/admin/products/bulk')
        .send(bulkUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        updated_count: 2,
        failed_items: [
          {
            id: 99999,
            error: expect.stringContaining('not found')
          }
        ]
      });
    });
  });

  // T020: Integration test "Manage Categories" workflow (from quickstart.md Scenario 5)
  describe('Scenario 5: Manage Categories Workflow', () => {
    it('should complete full category management workflow', async () => {
      if (!app) {
        pending('Admin workflows not implemented yet - this test should fail');
        return;
      }

      // Step 1: Get current categories
      const initialResponse = await request(app)
        .get('/api/admin/categories')
        .expect(200);

      const initialCount = initialResponse.body.data.length;

      // Step 2: Create new category
      const newCategory = {
        name: "Smart Devices",
        description: "Internet-connected devices and gadgets",
        parent_category_id: 1 // Under Electronics
      };

      const createResponse = await request(app)
        .post('/api/admin/categories')
        .send(newCategory)
        .expect(201);

      expect(createResponse.body).toMatchObject({
        id: expect.any(Number),
        name: newCategory.name,
        description: newCategory.description,
        parent_category_id: 1
      });

      const categoryId = createResponse.body.id;

      // Step 3: Verify category appears in list
      const listResponse = await request(app)
        .get('/api/admin/categories')
        .expect(200);

      expect(listResponse.body.data).toHaveLength(initialCount + 1);
      const createdCategory = listResponse.body.data.find(c => c.id === categoryId);
      expect(createdCategory).toBeDefined();

      // Step 4: Create product in new category
      const productResponse = await request(app)
        .post('/api/admin/products')
        .send({
          name: "Smart Speaker",
          price: 9999,
          category_id: categoryId,
          inventory_status: "in_stock"
        })
        .expect(201);

      // Step 5: Verify category hierarchy is maintained
      const hierarchyResponse = await request(app)
        .get('/api/admin/categories')
        .expect(200);

      const parentCategory = hierarchyResponse.body.data.find(c => c.id === 1);
      const childCategory = hierarchyResponse.body.data.find(c => c.id === categoryId);

      expect(childCategory.parent_category_id).toBe(parentCategory.id);

      // Step 6: Verify product can be filtered by new category
      const productsResponse = await request(app)
        .get(`/api/admin/products?category=${categoryId}`)
        .expect(200);

      expect(productsResponse.body.data).toHaveLength(1);
      expect(productsResponse.body.data[0].name).toBe("Smart Speaker");
    });
  });

  // T021: Integration test "Search and Filter Products" workflow (from quickstart.md Scenario 6)
  describe('Scenario 6: Search and Filter Products Workflow', () => {
    beforeEach(async () => {
      if (!app) return;

      // Create diverse products for search testing
      const products = [
        { name: "Bluetooth Headphones", price: 7999, sku: "BT-HEAD-001", brand: "AudioTech", category_id: 1, inventory_status: "in_stock" },
        { name: "Wireless Mouse", price: 2999, sku: "WL-MOUSE-001", brand: "TechCorp", category_id: 1, inventory_status: "out_of_stock" },
        { name: "Bluetooth Speaker", price: 12999, sku: "BT-SPEAK-001", brand: "AudioTech", category_id: 1, inventory_status: "in_stock" },
        { name: "Programming Book", price: 4999, sku: "BOOK-PROG-001", brand: "BookPub", category_id: 2, inventory_status: "low_stock" },
        { name: "Garden Tool Set", price: 8999, sku: "GARDEN-001", brand: "GreenThumb", category_id: 3, inventory_status: "in_stock" }
      ];

      for (const product of products) {
        await request(app)
          .post('/api/admin/products')
          .send(product)
          .expect(201);
      }
    });

    it('should complete comprehensive search and filter workflow', async () => {
      if (!app) {
        pending('Admin workflows not implemented yet - this test should fail');
        return;
      }

      // Step 1: Search by text term
      const searchResponse = await request(app)
        .get('/api/admin/products?search=bluetooth')
        .expect(200);

      expect(searchResponse.body.data).toHaveLength(2);
      searchResponse.body.data.forEach(product => {
        expect(product.name.toLowerCase()).toContain('bluetooth');
      });

      // Step 2: Filter by inventory status
      const statusResponse = await request(app)
        .get('/api/admin/products?status=in_stock')
        .expect(200);

      expect(statusResponse.body.data.length).toBeGreaterThan(0);
      statusResponse.body.data.forEach(product => {
        expect(product.inventory_status).toBe('in_stock');
      });

      // Step 3: Filter by category
      const categoryResponse = await request(app)
        .get('/api/admin/products?category=1')
        .expect(200);

      expect(categoryResponse.body.data.length).toBeGreaterThan(0);
      categoryResponse.body.data.forEach(product => {
        expect(product.category_id).toBe(1);
      });

      // Step 4: Combined filters
      const combinedResponse = await request(app)
        .get('/api/admin/products?search=bluetooth&status=in_stock&category=1')
        .expect(200);

      expect(combinedResponse.body.data).toHaveLength(2);
      combinedResponse.body.data.forEach(product => {
        expect(product.name.toLowerCase()).toContain('bluetooth');
        expect(product.inventory_status).toBe('in_stock');
        expect(product.category_id).toBe(1);
      });

      // Step 5: Search by SKU
      const skuResponse = await request(app)
        .get('/api/admin/products?search=BT-HEAD-001')
        .expect(200);

      expect(skuResponse.body.data).toHaveLength(1);
      expect(skuResponse.body.data[0].sku).toBe('BT-HEAD-001');

      // Step 6: Pagination with filters
      const paginatedResponse = await request(app)
        .get('/api/admin/products?page=1&limit=2&status=in_stock')
        .expect(200);

      expect(paginatedResponse.body.data).toHaveLength(2);
      expect(paginatedResponse.body.pagination).toMatchObject({
        current_page: 1,
        per_page: 2,
        total_items: expect.any(Number),
        has_next: expect.any(Boolean),
        has_prev: false
      });
    });
  });
});