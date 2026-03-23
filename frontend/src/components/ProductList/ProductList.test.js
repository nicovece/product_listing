import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductList from './ProductList';

const mockProducts = [
  { id: 1, name: 'Product A', price: 19.99, likes: 100, imageUrl: '/a.jpg' },
  { id: 2, name: 'Product B', price: 29.99, likes: 200, imageUrl: '/b.jpg' },
  { id: 3, name: 'Product C', price: 39.99, likes: 50, imageUrl: '/c.jpg' },
];

const multiPagePagination = {
  currentPage: 1,
  totalPages: 3,
  totalItems: 75,
  itemsPerPage: 25,
};

describe('ProductList', () => {
  it('renders all product cards', () => {
    render(<ProductList products={mockProducts} onPageChange={vi.fn()} />);

    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('Product C')).toBeInTheDocument();
  });

  it('shows pagination when there are multiple pages', () => {
    render(
      <ProductList
        products={mockProducts}
        pagination={multiPagePagination}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Product pagination')).toBeInTheDocument();
  });

  it('hides pagination when there is only one page', () => {
    const singlePage = { ...multiPagePagination, totalPages: 1 };
    render(
      <ProductList
        products={mockProducts}
        pagination={singlePage}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.queryByLabelText('Product pagination')).not.toBeInTheDocument();
  });

  it('hides pagination when pagination prop is not provided', () => {
    render(<ProductList products={mockProducts} onPageChange={vi.fn()} />);

    expect(screen.queryByLabelText('Product pagination')).not.toBeInTheDocument();
  });
});
