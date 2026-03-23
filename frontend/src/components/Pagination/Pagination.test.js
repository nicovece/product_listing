import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Pagination from './Pagination';

const defaultProps = {
  currentPage: 3,
  totalPages: 8,
  totalItems: 200,
  itemsPerPage: 25,
  onPageChange: vi.fn(),
};

const renderPagination = (overrides = {}) => {
  const props = { ...defaultProps, onPageChange: vi.fn(), ...overrides };
  render(<Pagination {...props} />);
  return props;
};

describe('Pagination', () => {
  it('renders showing items info', () => {
    renderPagination();

    expect(screen.getByText(/Showing 51-75 of 200 products/)).toBeInTheDocument();
  });

  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination {...defaultProps} totalPages={1} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('disables Previous button on first page', () => {
    renderPagination({ currentPage: 1 });

    expect(screen.getByLabelText('Previous page')).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    renderPagination({ currentPage: 8 });

    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });

  it('calls onPageChange when clicking a page number', () => {
    const { onPageChange } = renderPagination({ currentPage: 3 });

    fireEvent.click(screen.getByLabelText('Page 5'));

    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('calls onPageChange with next page on Next click', () => {
    const { onPageChange } = renderPagination({ currentPage: 3 });

    fireEvent.click(screen.getByLabelText('Next page'));

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange with previous page on Previous click', () => {
    const { onPageChange } = renderPagination({ currentPage: 3 });

    fireEvent.click(screen.getByLabelText('Previous page'));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('marks current page with aria-current', () => {
    renderPagination({ currentPage: 3 });

    expect(screen.getByLabelText('Page 3')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByLabelText('Page 4')).not.toHaveAttribute('aria-current');
  });

  it('shows ellipsis for distant pages', () => {
    renderPagination({ currentPage: 5, totalPages: 10 });

    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });
});
