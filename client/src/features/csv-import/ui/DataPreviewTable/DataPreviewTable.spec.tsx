import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataPreviewTable } from './DataPreviewTable';

const HEADERS = ['date', 'title', 'amount'];

const buildRows = () => [
  { date: '2026-01-01', title: 'Grocery Store', amount: '-50.00' },
  { date: '2026-01-02', title: 'Salary', amount: '8500.00' },
  { date: '2026-01-03', title: 'Netflix', amount: '-49.99' },
];

describe('DataPreviewTable', () => {
  it('renders all headers', () => {
    render(<DataPreviewTable headers={HEADERS} rows={buildRows()} />);

    expect(screen.getByText('date')).toBeInTheDocument();
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('amount')).toBeInTheDocument();
  });

  it('renders all row data', () => {
    render(<DataPreviewTable headers={HEADERS} rows={buildRows()} />);

    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  it('highlights selected row with primary-soft background', () => {
    render(
      <DataPreviewTable
        headers={HEADERS}
        rows={buildRows()}
        selectedRowIndex={1}
        onRowSelect={vi.fn()}
      />,
    );

    const salaryCell = screen.getByText('Salary');
    const row = salaryCell.closest('tr');
    expect(row).toHaveClass('bg-primary-soft');
  });

  it('does not highlight non-selected rows', () => {
    render(
      <DataPreviewTable
        headers={HEADERS}
        rows={buildRows()}
        selectedRowIndex={1}
        onRowSelect={vi.fn()}
      />,
    );

    const groceryCell = screen.getByText('Grocery Store');
    const row = groceryCell.closest('tr');
    expect(row).not.toHaveClass('bg-primary-soft');
  });

  it('calls onRowSelect with row index when row is clicked', async () => {
    const user = userEvent.setup();
    const handleRowSelect = vi.fn();

    render(
      <DataPreviewTable
        headers={HEADERS}
        rows={buildRows()}
        selectedRowIndex={0}
        onRowSelect={handleRowSelect}
      />,
    );

    await user.click(screen.getByText('Netflix'));

    expect(handleRowSelect).toHaveBeenCalledWith(2);
  });

  it('does not call onRowSelect when prop is not provided', async () => {
    const user = userEvent.setup();

    render(<DataPreviewTable headers={HEADERS} rows={buildRows()} />);

    // Should not throw — rows are not clickable
    await user.click(screen.getByText('Netflix'));
  });

  it('applies cursor-pointer class when onRowSelect is provided', () => {
    render(
      <DataPreviewTable
        headers={HEADERS}
        rows={buildRows()}
        selectedRowIndex={0}
        onRowSelect={vi.fn()}
      />,
    );

    const cell = screen.getByText('Grocery Store');
    const row = cell.closest('tr');
    expect(row).toHaveClass('cursor-pointer');
  });

  it('does not apply cursor-pointer class when onRowSelect is not provided', () => {
    render(<DataPreviewTable headers={HEADERS} rows={buildRows()} />);

    const cell = screen.getByText('Grocery Store');
    const row = cell.closest('tr');
    expect(row).not.toHaveClass('cursor-pointer');
  });
});
