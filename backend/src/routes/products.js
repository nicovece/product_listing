const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/products
router.get('/', (req, res) => {
  try {
    // Parse and validate query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const priceMin = req.query.priceMin ? parseFloat(req.query.priceMin) : null;
    const priceMax = req.query.priceMax ? parseFloat(req.query.priceMax) : null;
    const searchText = req.query.search || '';
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder || 'asc';

    // Validation
    if (page < 1) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Page must be greater than 0'
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Limit must be between 1 and 100'
      });
    }

    if (priceMin !== null && (priceMin < 0 || priceMin > 9999.99)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Minimum price must be between 0 and 9999.99'
      });
    }

    if (priceMax !== null && (priceMax < 0.01 || priceMax > 9999.99)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Maximum price must be between 0.01 and 9999.99'
      });
    }

    if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Minimum price cannot be greater than maximum price'
      });
    }

    // Get products
    const result = Product.findAll({
      page,
      limit,
      priceMin,
      priceMax,
      searchText,
      sortBy,
      sortOrder
    });

    // Build response
    const response = {
      products: result.products,
      pagination: {
        currentPage: result.currentPage,
        itemsPerPage: result.itemsPerPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages
      },
      appliedFilters: {
        ...(priceMin !== null && { priceMin }),
        ...(priceMax !== null && { priceMax }),
        ...(searchText && { searchText }),
        sortBy,
        sortOrder
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error in GET /api/products:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching products'
    });
  }
});

module.exports = router;