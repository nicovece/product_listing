const fs = require('fs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../products.db');

// Seed database if it doesn't exist yet
if (!fs.existsSync(dbPath)) {
  console.log('Database not found, running seed...');
  require('./database/seed');
}

// Start the server
require('./app');
