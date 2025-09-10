import React from 'react';
import styles from './EmptyState.module.css';

const EmptyState = ({ onClearFilters }) => {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>📦</div>
      <h3 className={styles.title}>No products found</h3>
      <p className={styles.message}>
        We couldn't find any products matching your current filters.
        Try adjusting your search criteria or clearing your filters.
      </p>
      <button
        onClick={onClearFilters}
        className={styles.clearButton}
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default EmptyState;