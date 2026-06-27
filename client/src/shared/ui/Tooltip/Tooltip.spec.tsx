import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Tooltip } from '#shared/ui/Tooltip';

describe('Tooltip', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(
        <Tooltip content="Info text">
          <button>Trigger</button>
        </Tooltip>,
      );

      expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
    });

    it('does not render tooltip until hovered', () => {
      render(
        <Tooltip content="Info text">
          <span>icon</span>
        </Tooltip>,
      );

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('shows tooltip on hover', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Helpful info">
          <span>icon</span>
        </Tooltip>,
      );

      await user.hover(screen.getByText('icon'));

      expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful info');
    });

    it('hides tooltip on unhover', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Helpful info">
          <span>icon</span>
        </Tooltip>,
      );

      await user.hover(screen.getByText('icon'));
      await user.unhover(screen.getByText('icon'));

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('links trigger to tooltip via aria-describedby', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Description">
          <span>icon</span>
        </Tooltip>,
      );

      const trigger = screen.getByText('icon').parentElement!;
      await user.hover(trigger);

      const tooltip = screen.getByRole('tooltip');
      expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
    });

    it('has tabIndex for keyboard access', () => {
      render(
        <Tooltip content="Info">
          <span>icon</span>
        </Tooltip>,
      );

      const trigger = screen.getByText('icon').parentElement!;
      expect(trigger).toHaveAttribute('tabindex', '0');
    });

    it('shows tooltip on focus', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Info">
          <span>icon</span>
        </Tooltip>,
      );

      await user.tab();

      expect(screen.getByRole('tooltip')).toHaveTextContent('Info');
    });
  });
});
