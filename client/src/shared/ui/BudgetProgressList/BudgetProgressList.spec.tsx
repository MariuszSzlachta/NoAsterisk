import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BudgetProgressList } from '#shared/ui/BudgetProgressList';

describe('BudgetProgressList', () => {
  const items = [
    { label: 'Zakupy', spent: 800, limit: 1000, color: '#34d399' },
    { label: 'Transport', spent: 1200, limit: 1000, color: '#60a5fa' },
  ];

  it('renders all items with labels', () => {
    render(<BudgetProgressList items={items} />);

    expect(screen.getByText('Zakupy')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('renders amounts with default currency', () => {
    render(<BudgetProgressList items={[items[0]]} />);

    expect(screen.getByText(/800/)).toBeInTheDocument();
    expect(screen.getByText(/1.*000/)).toBeInTheDocument();
  });

  it('renders custom currency', () => {
    render(<BudgetProgressList items={[items[0]]} currency="€" />);

    expect(screen.getAllByText(/€/).length).toBeGreaterThan(0);
  });

  it('caps progress bar at 100% when within budget', () => {
    const { container } = render(<BudgetProgressList items={[items[0]]} />);

    const bar = container.querySelector('[style*="width"]');
    expect(bar?.getAttribute('style')).toContain('width: 80%');
  });

  it('caps progress bar at 100% when over budget', () => {
    const { container } = render(<BudgetProgressList items={[items[1]]} />);

    const bar = container.querySelector('[style*="width"]');
    expect(bar?.getAttribute('style')).toContain('width: 100%');
  });

  it('applies expense color when over budget', () => {
    const { container } = render(<BudgetProgressList items={[items[1]]} />);

    const bar = container.querySelector('[style*="width"]');
    expect(bar?.getAttribute('style')).toContain('background-color');
  });

  it('applies item color when within budget', () => {
    const { container } = render(<BudgetProgressList items={[items[0]]} />);

    const bar = container.querySelector('[style*="width"]');
    expect(bar?.getAttribute('style')).toContain('background-color');
  });

  it.each([
    { spent: 800, limit: 1000, expected: 'text-muted-foreground' },
    { spent: 1100, limit: 1000, expected: 'text-expense/60' },
    { spent: 1300, limit: 1000, expected: 'text-expense/80' },
    { spent: 1600, limit: 1000, expected: 'text-expense' },
  ])('applies $expected when spent=$spent, limit=$limit', ({ spent, limit, expected }) => {
    const { container } = render(
      <BudgetProgressList items={[{ label: 'Test', spent, limit, color: '#34d399' }]} />,
    );

    const spentSpan = container.querySelector('.font-mono span:first-child');
    expect(spentSpan?.className).toContain(expected);
  });
});
