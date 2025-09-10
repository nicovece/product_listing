const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

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

// Migration system
function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get migrations directory
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found, skipping migrations');
      return;
    }

    // Get all migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Execute in alphabetical order

    // Get already executed migrations
    const executedMigrations = db.prepare('SELECT filename FROM migrations').all();
    const executedSet = new Set(executedMigrations.map(m => m.filename));

    // Execute pending migrations
    for (const filename of migrationFiles) {
      if (!executedSet.has(filename)) {
        console.log(`Running migration: ${filename}`);
        
        const migrationPath = path.join(migrationsDir, filename);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute migration in a transaction
        const transaction = db.transaction(() => {
          db.exec(migrationSQL);
          db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(filename);
        });
        
        transaction();
        console.log(`✓ Migration completed: ${filename}`);
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migrations on startup
runMigrations();

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

module.exports = db;