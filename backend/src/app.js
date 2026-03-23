const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const productsRouter = require('./routes/products');
const adminProductsRouter = require('./routes/admin/products');
const adminCategoriesRouter = require('./routes/admin/categories');

// Import middleware
const { sanitizeInput, createRateLimit, handleValidationErrors } = require('./middleware/validation');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Security middleware
app.use(sanitizeInput());

// Rate limiting for admin endpoints
app.use('/api/admin', createRateLimit(15 * 60 * 1000, 200)); // 200 requests per 15 minutes

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public routes
app.use('/api/products', productsRouter);

// Admin routes
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/categories', adminCategoriesRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Validation error handling middleware
app.use(handleValidationErrors);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  });
});

// Serve frontend for non-API routes (SPA client-side routing)
app.use('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    });
  }
  res.sendFile(indexPath);
});

const PORT = process.env.PORT || 3001;

// Start server (only if this file is run directly)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Public API: http://localhost:${PORT}/api/products`);
    console.log(`🔐 Admin API: http://localhost:${PORT}/api/admin/products`);
    console.log(`📂 Categories API: http://localhost:${PORT}/api/admin/categories`);
    console.log(`📁 File uploads: http://localhost:${PORT}/uploads`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;