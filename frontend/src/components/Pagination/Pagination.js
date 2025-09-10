import React from 'react';
import styles from './Pagination.module.css';

const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
  // Generate visible page numbers (show current ±2 pages)
  const getVisiblePages = () => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className={styles.pagination} aria-label="Product pagination">
      <div className={styles.info}>
        Showing {((currentPage - 1) * itemsPerPage) + 1}-
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products
      </div>

      <div className={styles.controls}>
        {/* Previous Button */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className={styles.navButton}
          aria-label="Previous page"
        >
          ← Previous
        </button>

        {/* First page + ellipsis if needed */}
        {visiblePages[0] > 1 && (
          <>
            <button 
              onClick={() => handlePageClick(1)} 
              className={styles.pageButton}
            >
              1
            </button>
            {visiblePages[0] > 2 && <span className={styles.ellipsis}>...</span>}
          </>
        )}

        {/* Visible page numbers */}
        {visiblePages.map(page => (
          <button
            key={page}
            onClick={() => handlePageClick(page)}
            className={`${styles.pageButton} ${page === currentPage ? styles.current : ''}`}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        {/* Last page + ellipsis if needed */}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && 
              <span className={styles.ellipsis}>...</span>
            }
            <button 
              onClick={() => handlePageClick(totalPages)} 
              className={styles.pageButton}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={styles.navButton}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </nav>
  );
};

export default Pagination;