import React from 'react';
import styles from './ProductCard.module.css';

const ProductCard = ({ product }) => {
  const { name, price, likes, imageUrl } = product;

  const handleImageError = (e) => {
    // Fallback to a generic placeholder if image fails to load
    e.target.src = `https://via.placeholder.com/300x300/e5e7eb/6b7280?text=${encodeURIComponent(name)}`;
  };

  return (
    <article className={styles.card}>
      <div className={styles.imageContainer}>
        <img 
          src={imageUrl} 
          alt={name}
          className={styles.image}
          loading="lazy"
          onError={handleImageError}
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.name} title={name}>{name}</h3>
        <div className={styles.details}>
          <div className={styles.price}>${price.toFixed(2)}</div>
          <div className={styles.likes}>
            <span className={styles.heartIcon}>❤️</span>
            {likes.toLocaleString()} likes
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;