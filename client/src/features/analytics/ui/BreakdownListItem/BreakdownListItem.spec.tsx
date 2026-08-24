import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { CategoryBreakdownItem } from '#features/analytics/model/types';

import { BreakdownListItem } from './BreakdownListItem';

const item: CategoryBreakdownItem = {
  category: 'Spożywcze',
  amount: 750,
  percentage: 60,
};

const defaultProps = {
  item,
  color: 'var(--cat-groceries)',
  maxAmount: 1000,
  isSelected: false,
  drilldownId: 'drilldown-panel',
  onClick: vi.fn(),
};

describe('BreakdownListItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders category name', () => {
    render(<BreakdownListItem {...defaultProps} />);
    expect(screen.getByText('Spożywcze')).toBeInTheDocument();
  });

  it('renders amount formatted', () => {
    render(<BreakdownListItem {...defaultProps} />);
    expect(screen.getByText(/750/)).toBeInTheDocument();
    expect(screen.getByText(/zł/)).toBeInTheDocument();
  });

  it('renders percentage', () => {
    render(<BreakdownListItem {...defaultProps} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('calculates bar width relative to maxAmount', () => {
    const { container } = render(<BreakdownListItem {...defaultProps} />);
    // 750/1000 = 75%
    const bar = container.querySelector('[style*="width: 75%"]');
    expect(bar).toBeInTheDocument();
  });

  it('sets aria-expanded=false when not selected', () => {
    render(<BreakdownListItem {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('sets aria-expanded=true and aria-controls when selected', () => {
    render(<BreakdownListItem {...defaultProps} isSelected={true} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', 'drilldown-panel');
  });

  it('applies bg-surface-2 when selected', () => {
    const { container } = render(<BreakdownListItem {...defaultProps} isSelected={true} />);
    const button = container.querySelector('.bg-surface-2');
    expect(button).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<BreakdownListItem {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders color dot with correct background', () => {
    const { container } = render(<BreakdownListItem {...defaultProps} />);
    const dot = container.querySelector('[style*="background-color: var(--cat-groceries)"]');
    expect(dot).toBeInTheDocument();
  });

  it('handles zero maxAmount without error', () => {
    render(<BreakdownListItem {...defaultProps} maxAmount={0} />);
    // Bar width should be 0%
    const { container } = render(<BreakdownListItem {...defaultProps} maxAmount={0} />);
    const bar = container.querySelector('[style*="width: 0%"]');
    expect(bar).toBeInTheDocument();
  });
});
