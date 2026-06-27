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

      expect(
        screen.getByRole('button', { name: 'Trigger' }),
      ).toBeInTheDocument();
    });

    it('exposes tooltip content to assistive technology', () => {
      render(
        <Tooltip content="Info text">
          <span>icon</span>
        </Tooltip>,
      );

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('renders tooltip content text', () => {
      render(
        <Tooltip content="Helpful info">
          <span>icon</span>
        </Tooltip>,
      );

      expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful info');
    });
  });

  describe('accessibility', () => {
    it('links trigger to tooltip via aria-describedby', () => {
      render(
        <Tooltip content="Description">
          <span>icon</span>
        </Tooltip>,
      );

      const tooltip = screen.getByRole('tooltip');
      const trigger = tooltip.parentElement;

      expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
    });

    it('has tabIndex for keyboard access', () => {
      render(
        <Tooltip content="Info">
          <span>icon</span>
        </Tooltip>,
      );

      const trigger = screen.getByRole('tooltip').parentElement;
      expect(trigger).toHaveAttribute('tabindex', '0');
    });

    it('is focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Info">
          <span>icon</span>
        </Tooltip>,
      );

      await user.tab();

      const trigger = screen.getByRole('tooltip').parentElement;
      expect(trigger).toHaveFocus();
    });
  });

  describe('placement', () => {
    it('defaults to top placement', () => {
      render(
        <Tooltip content="Info">
          <span>icon</span>
        </Tooltip>,
      );

      expect(screen.getByRole('tooltip')).toHaveAttribute(
        'data-placement',
        'top',
      );
    });

    it.each(['top', 'bottom', 'left', 'right'] as const)(
      'renders with placement=%s',
      (placement) => {
        render(
          <Tooltip content="Info" placement={placement}>
            <span>icon</span>
          </Tooltip>,
        );

        expect(screen.getByRole('tooltip')).toHaveAttribute(
          'data-placement',
          placement,
        );
      },
    );
  });
});
