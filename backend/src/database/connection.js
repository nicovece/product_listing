const Database = require('better-sqlite3');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '../../products.db');

// Create database connection
const db = new Database(dbPath, {
  // Options for better performance
  verbose: process.env.NODE_ENV === 'development' ? console.log : null,
  fileMustExist: false // Create if doesn't exist
});

// Enable foreign keys and optimize for performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

module.exports = db;