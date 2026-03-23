import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FilterPanel from './FilterPanel';

const defaultFilters = {
  priceMin: '',
  priceMax: '',
  search: '',
  sortBy: 'name',
  sortOrder: 'asc',
};

const renderFilterPanel = (overrides = {}) => {
  const props = {
    filters: defaultFilters,
    onFilterChange: vi.fn(),
    onClearFilters: vi.fn(),
    ...overrides,
  };
  render(<FilterPanel {...props} />);
  return props;
};

describe('FilterPanel', () => {
  it('renders search input, price inputs, and sort dropdown', () => {
    renderFilterPanel();

    expect(screen.getByLabelText('Search Products')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min ($)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Max ($)')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort By')).toBeInTheDocument();
  });

  it('updates search input value on typing', () => {
    renderFilterPanel();

    const searchInput = screen.getByLabelText('Search Products');
    fireEvent.change(searchInput, { target: { value: 'laptop' } });

    expect(searchInput).toHaveValue('laptop');
  });

  it('shows clear search button when search has value', () => {
    renderFilterPanel({
      filters: { ...defaultFilters, search: 'laptop' },
    });

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('does not show clear search button when search is empty', () => {
    renderFilterPanel();

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('shows "Clear All Filters" button when filters are active', () => {
    renderFilterPanel({
      filters: { ...defaultFilters, search: 'test' },
    });

    expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
  });

  it('hides "Clear All Filters" button when no filters are active', () => {
    renderFilterPanel();

    expect(screen.queryByText('Clear All Filters')).not.toBeInTheDocument();
  });

  it('calls onClearFilters when clear button is clicked', () => {
    const { onClearFilters } = renderFilterPanel({
      filters: { ...defaultFilters, search: 'test' },
    });

    fireEvent.click(screen.getByText('Clear All Filters'));

    expect(onClearFilters).toHaveBeenCalledOnce();
  });

  it('calls onFilterChange when sort option changes', () => {
    const { onFilterChange } = renderFilterPanel();

    fireEvent.change(screen.getByLabelText('Sort By'), {
      target: { value: 'price_desc' },
    });

    expect(onFilterChange).toHaveBeenCalledWith({
      sortBy: 'price',
      sortOrder: 'desc',
    });
  });
});
