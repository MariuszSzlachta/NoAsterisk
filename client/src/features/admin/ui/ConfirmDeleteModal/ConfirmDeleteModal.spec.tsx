import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDeleteModal } from './ConfirmDeleteModal';

// ─── Mock i18n ───────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    title: 'Delete user?',
    description: 'This action cannot be undone.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders title and description', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    expect(screen.getByText('Delete user?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('admin.modal.delete'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('admin.modal.cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key pressed', () => {
    const onCancel = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel for non-Escape keys', () => {
    const onCancel = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when backdrop clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onCancel={onCancel} />);

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when modal content clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Delete user?'));

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('has correct aria attributes', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-delete-title');
  });
});
