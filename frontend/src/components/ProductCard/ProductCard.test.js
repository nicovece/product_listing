import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProductCard from './ProductCard';

const mockProduct = {
  id: 1,
  name: 'Wireless Headphones',
  price: 49.99,
  likes: 1234,
  imageUrl: '/images/headphones.jpg',
};

describe('ProductCard', () => {
  it('renders product name, price, and likes', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('1,234 likes')).toBeInTheDocument();
  });

  it('renders product image with lazy loading', () => {
    render(<ProductCard product={mockProduct} />);

    const img = screen.getByAltText('Wireless Headphones');
    expect(img).toHaveAttribute('src', '/images/headphones.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('shows placeholder on image error', () => {
    render(<ProductCard product={mockProduct} />);

    const img = screen.getByAltText('Wireless Headphones');
    fireEvent.error(img);

    expect(img.src).toContain('placeholder');
    expect(img.src).toContain('Wireless%20Headphones');
  });

  it('formats price to two decimal places', () => {
    const product = { ...mockProduct, price: 10 };
    render(<ProductCard product={product} />);

    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });
});
