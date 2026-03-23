const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Database connection
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../products.db');
const db = new Database(dbPath);

// Read and execute schema
const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

// Seed data generation
function generateProducts() {
  const productNames = [
    // Electronics
    'Wireless Bluetooth Headphones', 'Gaming Mechanical Keyboard', 
    'USB-C Hub with HDMI', '4K Webcam for Streaming', 'Portable SSD 1TB',
    'Smart Fitness Watch', 'Wireless Phone Charger', 'Bluetooth Speaker',
    'Noise Cancelling Earbuds', 'Tablet Stand Adjustable',
    
    // Home & Garden  
    'Ceramic Coffee Mug Set', 'LED Desk Lamp with Timer', 
    'Memory Foam Pillow', 'Essential Oil Diffuser', 'Plant Pot with Drainage',
    'Bamboo Cutting Board', 'Stainless Steel Water Bottle', 'Yoga Mat Non-Slip',
    'Throw Blanket Soft', 'Wall Clock Modern',
    
    // Books & Media
    'Programming Book JavaScript', 'Notebook Hardcover Lined',
    'Art Supplies Watercolor Set', 'Board Game Strategy', 'Puzzle 1000 Pieces',
    'Magazine Subscription Tech', 'Bookmark Set Leather', 'Pen Set Professional',
    'Calculator Scientific', 'Highlighter Set Colors',
    
    // Fashion & Accessories
    'Backpack Laptop Compartment', 'Sunglasses Polarized', 
    'Watch Band Leather', 'Phone Case Clear', 'Wallet Minimalist',
    'Scarf Wool Winter', 'Hat Baseball Cap', 'Belt Genuine Leather',
    'Socks Cotton Pack', 'Gloves Touchscreen Compatible',
    
    // Sports & Outdoors
    'Water Bottle Insulated', 'Hiking Backpack 30L',
    'Camping Chair Foldable', 'Flashlight LED Rechargeable', 'First Aid Kit',
    'Bike Light Set', 'Sports Towel Quick Dry', 'Protein Shaker Bottle',
    'Resistance Bands Set', 'Tennis Ball Pack',
    
    // Kitchen & Dining
    'Knife Set Stainless Steel', 'Mixing Bowls Glass Set',
    'Coffee Grinder Manual', 'Tea Kettle Whistling', 'Cutting Mat Flexible',
    'Measuring Cups Steel', 'Spice Rack Rotating', 'Oven Mitts Heat Resistant',
    'Food Storage Containers', 'Can Opener Manual',
    
    // Health & Beauty
    'Electric Toothbrush', 'Hair Dryer Ionic', 
    'Face Mask Sheet Pack', 'Moisturizer Daily Use', 'Shampoo Organic',
    'Nail Clippers Set', 'Tweezers Precision', 'Mirror Makeup LED',
    'Lip Balm Natural', 'Hand Cream Set',
    
    // Office & School
    'Desk Organizer Bamboo', 'Stapler Heavy Duty',
    'Paper Clips Assorted', 'Sticky Notes Colorful', 'Ruler Metal 12 Inch',
    'Scissors Precision', 'Tape Dispenser Desktop', 'Eraser Pack White',
    'Pencil Sharpener Electric', 'Binder Clips Large',
    
    // Tools & Hardware
    'Screwdriver Set Multi-bit', 'Hammer Claw 16oz',
    'Measuring Tape 25ft', 'Level Bubble 24 Inch', 'Wrench Set Adjustable',
    'Drill Bits Set', 'Pliers Multi-tool', 'Flashlight Work LED',
    'Safety Glasses Clear', 'Work Gloves Padded'
  ];

  // Generate 180 products (ensures 6+ pages at 25/page)
  const products = [];
  const usedNames = new Set();
  
  for (let i = 0; i < 180; i++) {
    let name;
    do {
      name = productNames[Math.floor(Math.random() * productNames.length)];
      if (usedNames.size < productNames.length) {
        if (!usedNames.has(name)) {
          usedNames.add(name);
          break;
        }
      } else {
        // Add variation to duplicate names
        name = `${name} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
        break;
      }
    } while (true);
    
    // Price distribution: $5-$500 with realistic clustering
    let price;
    const priceCategory = Math.random();
    if (priceCategory < 0.4) {
      // 40% under $50 (budget items)
      price = 5 + Math.random() * 45;
    } else if (priceCategory < 0.7) {
      // 30% $50-$150 (mid-range)  
      price = 50 + Math.random() * 100;
    } else if (priceCategory < 0.9) {
      // 20% $150-$300 (premium)
      price = 150 + Math.random() * 150;
    } else {
      // 10% $300-$500 (luxury)
      price = 300 + Math.random() * 200;
    }
    
    // Likes distribution: realistic engagement patterns
    let likes;
    const likeCategory = Math.random();
    if (likeCategory < 0.3) {
      // 30% low engagement (0-20 likes)
      likes = Math.floor(Math.random() * 21);
    } else if (likeCategory < 0.7) {
      // 40% moderate engagement (20-200 likes)
      likes = 20 + Math.floor(Math.random() * 180);
    } else if (likeCategory < 0.9) {
      // 20% high engagement (200-800 likes)  
      likes = 200 + Math.floor(Math.random() * 600);
    } else {
      // 10% viral engagement (800-2000 likes)
      likes = 800 + Math.floor(Math.random() * 1200);
    }
    
    // Generate consistent image URL from Picsum Photos
    const imageUrl = `https://picsum.photos/300/300?random=${i + 1}`;
    
    products.push({
      name: name.trim(),
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      likes: likes,
      imageUrl: imageUrl
    });
  }
  
  return products;
}

// Insert seed data
function seedDatabase() {
  console.log('🌱 Generating seed data...');
  
  // Execute schema first
  db.exec(schemaSQL);
  
  const products = generateProducts();
  
  // Prepare insert statement
  const insert = db.prepare(`
    INSERT INTO products (name, price, likes, imageUrl) 
    VALUES (?, ?, ?, ?)
  `);
  
  // Insert all products in a transaction for performance
  const insertMany = db.transaction((products) => {
    for (const product of products) {
      insert.run(product.name, product.price, product.likes, product.imageUrl);
    }
  });
  
  console.log(`📦 Inserting ${products.length} products...`);
  insertMany(products);
  
  // Verify insertion
  const count = db.prepare('SELECT COUNT(*) as total FROM products').get();
  console.log(`✅ Database seeded with ${count.total} products`);
  
  // Show sample data
  const samples = db.prepare('SELECT * FROM products ORDER BY RANDOM() LIMIT 5').all();
  console.log('🎲 Sample products:');
  samples.forEach(product => {
    console.log(`  ${product.id}: ${product.name} - $${product.price} (${product.likes} likes)`);
  });
  
  // Show price and likes distribution
  const priceStats = db.prepare(`
    SELECT 
      MIN(price) as min_price,
      MAX(price) as max_price,
      AVG(price) as avg_price,
      MIN(likes) as min_likes,
      MAX(likes) as max_likes,
      AVG(likes) as avg_likes
    FROM products
  `).get();
  
  console.log('📊 Data distribution:');
  console.log(`  Prices: $${priceStats.min_price.toFixed(2)} - $${priceStats.max_price.toFixed(2)} (avg: $${priceStats.avg_price.toFixed(2)})`);
  console.log(`  Likes: ${priceStats.min_likes} - ${priceStats.max_likes} (avg: ${Math.round(priceStats.avg_likes)})`);
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
  db.close();
  console.log('🎯 Database setup complete!');
}

module.exports = { seedDatabase };