import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { CategoryDrilldownTransaction } from '#features/analytics/model/types';

import { TransactionRow } from './TransactionRow';

const transaction: CategoryDrilldownTransaction = {
  id: 'tx-1',
  title: 'BIEDRONKA Kraków',
  amount: 87.43,
  date: '2026-08-20',
};

describe('TransactionRow', () => {
  it('renders transaction title', () => {
    render(<TransactionRow transaction={transaction} isExpense={true} color="var(--cat-groceries)" />);
    expect(screen.getByText('BIEDRONKA Kraków')).toBeInTheDocument();
  });

  it('renders transaction date', () => {
    render(<TransactionRow transaction={transaction} isExpense={true} color="var(--cat-groceries)" />);
    expect(screen.getByText('2026-08-20')).toBeInTheDocument();
  });

  it('renders amount with minus prefix for expense', () => {
    render(<TransactionRow transaction={transaction} isExpense={true} color="var(--cat-groceries)" />);
    expect(screen.getByText(/−.*87/)).toBeInTheDocument();
  });

  it('renders amount with plus prefix for income', () => {
    render(<TransactionRow transaction={transaction} isExpense={false} color="var(--income)" />);
    expect(screen.getByText(/\+.*87/)).toBeInTheDocument();
  });

  it('applies text-expense class for expenses', () => {
    const { container } = render(
      <TransactionRow transaction={transaction} isExpense={true} color="var(--cat-groceries)" />,
    );
    expect(container.querySelector('.text-expense')).toBeInTheDocument();
  });

  it('applies text-income class for income', () => {
    const { container } = render(
      <TransactionRow transaction={transaction} isExpense={false} color="var(--income)" />,
    );
    expect(container.querySelector('.text-income')).toBeInTheDocument();
  });

  it('renders color dot with specified color', () => {
    const { container } = render(
      <TransactionRow transaction={transaction} isExpense={true} color="var(--cat-groceries)" />,
    );
    const dot = container.querySelector('[style*="background-color: var(--cat-groceries)"]');
    expect(dot).toBeInTheDocument();
  });
});
