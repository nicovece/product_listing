const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

describe('Database Schema', () => {
  let db;
  
  beforeEach(() => {
    // Use in-memory database for tests
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  test('should create products table with correct schema', () => {
    // This test will fail until we implement the schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../../src/database/schema.sql'), 'utf8');
    
    expect(() => {
      db.exec(schemaSQL);
    }).not.toThrow();

    // Verify table structure
    const tableInfo = db.prepare("PRAGMA table_info(products)").all();
    
    expect(tableInfo).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'id', type: 'INTEGER', pk: 1 }),
        expect.objectContaining({ name: 'name', type: 'TEXT', notnull: 1 }),
        expect.objectContaining({ name: 'price', type: 'DECIMAL(10,2)', notnull: 1 }),
        expect.objectContaining({ name: 'likes', type: 'INTEGER', notnull: 1, dflt_value: '0' }),
        expect.objectContaining({ name: 'imageUrl', type: 'TEXT', notnull: 1 }),
      ])
    );
  });

  test('should create required indexes', () => {
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../../src/database/schema.sql'), 'utf8');
    db.exec(schemaSQL);

    const indexes = db.prepare("PRAGMA index_list(products)").all();
    const indexNames = indexes.map(idx => idx.name);

    expect(indexNames).toContain('idx_products_price');
    expect(indexNames).toContain('idx_products_likes');
    expect(indexNames).toContain('idx_products_name');
  });

  test('should enforce validation constraints', () => {
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../../src/database/schema.sql'), 'utf8');
    db.exec(schemaSQL);

    const insert = db.prepare(`
      INSERT INTO products (name, price, likes, imageUrl) 
      VALUES (?, ?, ?, ?)
    `);

    // Should reject invalid data
    expect(() => {
      insert.run('', 10.00, 5, 'https://example.com/image.jpg'); // empty name
    }).toThrow();

    expect(() => {
      insert.run('Product', -5.00, 5, 'https://example.com/image.jpg'); // negative price
    }).toThrow();

    expect(() => {
      insert.run('Product', 10.00, -1, 'https://example.com/image.jpg'); // negative likes
    }).toThrow();

    expect(() => {
      insert.run('Product', 10.00, 5, 'http://example.com/image.jpg'); // non-HTTPS URL
    }).toThrow();
  });

  test('should generate seed data correctly', () => {
    const { seedDatabase } = require('../../src/database/seed');
    
    // Mock console.log to suppress output during tests
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    seedDatabase();

    const count = db.prepare('SELECT COUNT(*) as total FROM products').get();
    expect(count.total).toBeGreaterThanOrEqual(150);
    expect(count.total).toBeLessThanOrEqual(200);

    // Check data distribution
    const priceStats = db.prepare(`
      SELECT 
        MIN(price) as min_price,
        MAX(price) as max_price,
        MIN(likes) as min_likes,
        MAX(likes) as max_likes
      FROM products
    `).get();

    expect(priceStats.min_price).toBeGreaterThanOrEqual(5.00);
    expect(priceStats.max_price).toBeLessThanOrEqual(500.00);
    expect(priceStats.min_likes).toBeGreaterThanOrEqual(0);
    expect(priceStats.max_likes).toBeLessThanOrEqual(2000);

    // Check image URLs
    const sampleProducts = db.prepare('SELECT imageUrl FROM products LIMIT 5').all();
    sampleProducts.forEach(product => {
      expect(product.imageUrl).toMatch(/^https:\/\/picsum\.photos\/300\/300\?random=\d+$/);
    });

    consoleSpy.mockRestore();
  });
});