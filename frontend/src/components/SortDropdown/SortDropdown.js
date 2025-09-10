import React from 'react';
import styles from './SortDropdown.module.css';

const SortDropdown = ({ sortBy, sortOrder, onSortChange }) => {
  const sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' },
    { value: 'name_desc', label: 'Name (Z-A)', field: 'name', direction: 'desc' },
    { value: 'price_asc', label: 'Price (Low to High)', field: 'price', direction: 'asc' },
    { value: 'price_desc', label: 'Price (High to Low)', field: 'price', direction: 'desc' },
    { value: 'likes_desc', label: 'Most Liked', field: 'likes', direction: 'desc' },
    { value: 'likes_asc', label: 'Least Liked', field: 'likes', direction: 'asc' }
  ];

  const currentValue = `${sortBy}_${sortOrder}`;

  const handleSortChange = (e) => {
    const selectedOption = sortOptions.find(opt => opt.value === e.target.value);
    if (selectedOption) {
      onSortChange(selectedOption.field, selectedOption.direction);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Sort By</h3>
      <div className={styles.dropdownContainer}>
        <select
          value={currentValue}
          onChange={handleSortChange}
          className={styles.select}
          aria-label="Sort products by"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SortDropdown;