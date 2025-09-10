import React from 'react';
import ProductCard from '../ProductCard/ProductCard';
import Pagination from '../Pagination/Pagination';
import styles from './ProductList.module.css';

const ProductList = ({ products, pagination, onPageChange }) => {
  return (
    <>
      <div className={styles.productGrid}>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className={styles.paginationWrapper}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
};

export default ProductList;