const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../products.db');
const seedDbPath = path.join(__dirname, '../products.db.seed');

// Check if database exists and is fully migrated
let needsSeed = false;

if (!fs.existsSync(dbPath)) {
  needsSeed = true;
} else {
  try {
    const testDb = new Database(dbPath, { readonly: true });
    // Verify the products table has the extended columns from migration 002
    const columns = testDb.pragma('table_info(products)').map(c => c.name);
    testDb.close();
    if (!columns.includes('inventory_status')) needsSeed = true;
  } catch {
    needsSeed = true;
  }
}

if (needsSeed) {
  if (fs.existsSync(seedDbPath)) {
    console.log('Database missing or incomplete, copying seed database...');
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    fs.copyFileSync(seedDbPath, dbPath);
    console.log('Seed database ready.');
  } else {
    console.error('No seed database found at', seedDbPath);
    process.exit(1);
  }
}

// Start the server (connection.js will run any future migrations)
const app = require('./app');

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
