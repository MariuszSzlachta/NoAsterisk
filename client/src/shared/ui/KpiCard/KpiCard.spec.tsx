import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { KpiCard } from '#shared/ui/KpiCard';

const DEFAULT_PROPS = {
  label: 'Saldo',
  value: '12 450,00 zł',
  icon: <span data-testid="icon">W</span>,
};

describe('KpiCard', () => {
  describe('rendering', () => {
    it('renders label and value', () => {
      render(<KpiCard {...DEFAULT_PROPS} />);

      expect(screen.getByText('Saldo')).toBeInTheDocument();
      expect(screen.getByText('12 450,00 zł')).toBeInTheDocument();
    });

    it('renders icon', () => {
      render(<KpiCard {...DEFAULT_PROPS} />);

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders delta badge when delta provided', () => {
      render(<KpiCard {...DEFAULT_PROPS} delta="+2,4%" trend="up" />);

      expect(screen.getByText('+2,4%')).toBeInTheDocument();
    });

    it('does not render delta when not provided', () => {
      render(<KpiCard {...DEFAULT_PROPS} />);

      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });
  });

  describe('tooltip', () => {
    it('does not render tooltip when tooltip prop is absent', () => {
      render(<KpiCard {...DEFAULT_PROPS} />);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders tooltip when tooltip prop is provided', () => {
      render(<KpiCard {...DEFAULT_PROPS} tooltip="Suma środków na kontach." />);

      expect(screen.getByRole('tooltip')).toHaveTextContent('Suma środków na kontach.');
    });

    it('tooltip is accessible via aria-describedby', () => {
      render(<KpiCard {...DEFAULT_PROPS} tooltip="Info text" />);

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.parentElement).toHaveAttribute('aria-describedby', tooltip.id);
    });
  });
});
