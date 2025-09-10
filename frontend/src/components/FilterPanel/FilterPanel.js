import React, { useState, useEffect } from 'react';
import styles from './FilterPanel.module.css';

const FilterPanel = ({ filters, onFilterChange, onClearFilters }) => {
  const [localFilters, setLocalFilters] = useState({
    priceMin: filters.priceMin || '',
    priceMax: filters.priceMax || '',
    search: filters.search || ''
  });

  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Update local state when props change
  useEffect(() => {
    setLocalFilters({
      priceMin: filters.priceMin || '',
      priceMax: filters.priceMax || '',
      search: filters.search || ''
    });
  }, [filters]);

  // Debounced update function
  const debouncedUpdate = (newFilters) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      onFilterChange(newFilters);
    }, 300);

    setDebounceTimer(timer);
  };

  const handlePriceChange = (field, value) => {
    const numericValue = value === '' ? '' : parseFloat(value);
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);

    // Validate price range
    if (field === 'priceMin' || field === 'priceMax') {
      const min = field === 'priceMin' ? numericValue : (localFilters.priceMin === '' ? '' : parseFloat(localFilters.priceMin));
      const max = field === 'priceMax' ? numericValue : (localFilters.priceMax === '' ? '' : parseFloat(localFilters.priceMax));

      if (min !== '' && max !== '' && min > max) {
        return; // Don't update if invalid range
      }

      debouncedUpdate({ 
        priceMin: min === '' ? '' : min,
        priceMax: max === '' ? '' : max
      });
    }
  };

  const handleSearchChange = (value) => {
    const newFilters = { ...localFilters, search: value };
    setLocalFilters(newFilters);
    debouncedUpdate({ search: value });
  };

  const hasActiveFilters = localFilters.priceMin || localFilters.priceMax || localFilters.search;

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Filters</h3>

      {/* Search Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.label} htmlFor="product-search">
          Search Products
        </label>
        <div className={styles.searchContainer}>
          <input
            id="product-search"
            type="text"
            value={localFilters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Enter product name..."
            className={styles.searchInput}
          />
          {localFilters.search && (
            <button
              onClick={() => handleSearchChange('')}
              className={styles.clearSearchButton}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <small className={styles.hint}>
          Search updates automatically as you type
        </small>
      </div>

      {/* Price Range Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.label}>Price Range</label>
        
        <div className={styles.priceInputs}>
          <div className={styles.priceInputGroup}>
            <input
              type="number"
              value={localFilters.priceMin}
              onChange={(e) => handlePriceChange('priceMin', e.target.value)}
              placeholder="Min ($)"
              min="0"
              max="9999.99"
              step="0.01"
              className={styles.priceInput}
            />
          </div>
          <span className={styles.priceSeparator}>to</span>
          <div className={styles.priceInputGroup}>
            <input
              type="number"
              value={localFilters.priceMax}
              onChange={(e) => handlePriceChange('priceMax', e.target.value)}
              placeholder="Max ($)"
              min="0.01"
              max="9999.99"
              step="0.01"
              className={styles.priceInput}
            />
          </div>
        </div>

        <small className={styles.hint}>
          Enter price range to filter products
        </small>
      </div>

      {/* Sort Dropdown */}
      <div className={styles.filterGroup}>
        <label className={styles.label} htmlFor="sort-select">
          Sort By
        </label>
        <select
          id="sort-select"
          className={styles.sortSelect}
          value={`${filters.sortBy}_${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('_');
            onFilterChange({ sortBy, sortOrder });
          }}
        >
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="price_asc">Price (Low to High)</option>
          <option value="price_desc">Price (High to Low)</option>
          <option value="likes_desc">Most Liked</option>
          <option value="likes_asc">Least Liked</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className={styles.clearButton}
        >
          Clear All Filters
        </button>
      )}

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className={styles.activeIndicator}>
          <small>✓ Filters Applied</small>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;