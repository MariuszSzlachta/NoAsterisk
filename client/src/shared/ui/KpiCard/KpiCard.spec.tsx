import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { KpiCard } from '#shared/ui/KpiCard';

const DEFAULT_PROPS = {
  label: 'Saldo',
  value: '12 450,00 zł',
  icon: <span data-testid="icon">W</span>,
};

const renderWithRouter = (ui: React.ReactElement): ReturnType<typeof render> =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('KpiCard', () => {
  describe('rendering', () => {
    it('renders label and value', () => {
      renderWithRouter(<KpiCard {...DEFAULT_PROPS} />);

      expect(screen.getByText('Saldo')).toBeInTheDocument();
      expect(screen.getByText('12 450,00 zł')).toBeInTheDocument();
    });

    it('renders icon', () => {
      renderWithRouter(<KpiCard {...DEFAULT_PROPS} />);

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders delta badge when delta provided', () => {
      renderWithRouter(<KpiCard {...DEFAULT_PROPS} delta="+2,4%" trend="up" />);

      expect(screen.getByText('+2,4%')).toBeInTheDocument();
    });

    it('does not render delta when not provided', () => {
      renderWithRouter(<KpiCard {...DEFAULT_PROPS} />);

      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });
  });

  describe('tooltip', () => {
    it('does not render tooltip when tooltip prop is absent', () => {
      renderWithRouter(<KpiCard {...DEFAULT_PROPS} />);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders tooltip when tooltip prop is provided', async () => {
      const { container } = renderWithRouter(
        <KpiCard {...DEFAULT_PROPS} tooltip="Suma środków na kontach." />,
      );

      const trigger = container.querySelector('[aria-describedby]')!;
      await userEvent.hover(trigger);

      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Suma środków na kontach.',
      );
    });

    it('tooltip is accessible via aria-describedby', async () => {
      const { container } = renderWithRouter(
        <KpiCard {...DEFAULT_PROPS} tooltip="Info text" />,
      );

      const trigger = container.querySelector('[aria-describedby]')!;
      await userEvent.hover(trigger);

      const tooltip = screen.getByRole('tooltip');
      expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
    });
  });

  describe('iconHref', () => {
    it('renders icon as a link when iconHref is provided', () => {
      renderWithRouter(
        <KpiCard {...DEFAULT_PROPS} iconHref="/reports/balance" />,
      );

      const link = screen.getByRole('link', { name: /raport szczegółowy/i });
      expect(link).toHaveAttribute('href', '/reports/balance');
      expect(link).toContainElement(screen.getByTestId('icon'));
    });

    it('renders icon as plain span when iconHref is not provided', () => {
      renderWithRouter(<KpiCard {...DEFAULT_PROPS} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });
});
