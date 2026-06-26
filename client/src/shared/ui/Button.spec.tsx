import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '#shared/ui/Button';

describe('Button', () => {
  describe('rendering', () => {
    it('renders children text', () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('applies primary variant classes by default', () => {
      render(<Button>Primary</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-primary');
    });

    it.each(['primary', 'secondary', 'ghost', 'destructive'] as const)(
      'renders %s variant without error',
      (variant) => {
        render(<Button variant={variant}>Test</Button>);

        expect(screen.getByRole('button')).toBeInTheDocument();
      },
    );

    it.each(['sm', 'md', 'lg'] as const)('renders %s size without error', (size) => {
      render(<Button size={size}>Test</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Click</Button>);

      await userEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('supports aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>);

      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
    });

    it('renders as disabled with disabled attribute', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('custom className', () => {
    it('appends additional className', () => {
      render(<Button className="mt-4">Styled</Button>);

      expect(screen.getByRole('button').className).toContain('mt-4');
    });
  });
});
