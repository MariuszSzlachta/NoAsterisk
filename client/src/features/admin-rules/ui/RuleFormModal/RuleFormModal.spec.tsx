import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RuleFormModal } from './RuleFormModal';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('#entities/category', () => ({
  CATEGORY_SELECT_OPTIONS: [
    { value: 'cat-groceries', label: 'Groceries' },
    { value: 'cat-transport', label: 'Transport' },
  ],
}));

const mockHandleFieldChange = vi.fn();
const mockHandleSubmit = vi.fn();
const mockHandleCancel = vi.fn();

vi.mock('#features/admin-rules/ui/hooks/useRuleForm', () => ({
  useRuleForm: () => ({
    formValues: {
      keyword: '',
      matcherType: 'Contains',
      categoryId: '',
      priority: 1,
    },
    errors: {},
    isEditing: false,
    handleFieldChange: mockHandleFieldChange,
    handleSubmit: mockHandleSubmit,
    handleCancel: mockHandleCancel,
  }),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('RuleFormModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with all fields', () => {
    render(<RuleFormModal {...defaultProps} />);

    expect(screen.getByLabelText('rules.form.keyword')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'rules.form.matcher' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'rules.form.category' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('rules.form.priority')).toBeInTheDocument();
  });

  it('shows "add" title when not editing', () => {
    render(<RuleFormModal {...defaultProps} />);

    expect(screen.getByText('rules.form.titleAdd')).toBeInTheDocument();
  });

  it('calls handleSubmit when submit button clicked', () => {
    render(<RuleFormModal {...defaultProps} />);

    fireEvent.click(screen.getByText('rules.form.add'));

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls handleCancel when cancel button clicked', () => {
    render(<RuleFormModal {...defaultProps} />);

    fireEvent.click(screen.getByText('rules.form.cancel'));

    expect(mockHandleCancel).toHaveBeenCalledTimes(1);
  });

  it('calls handleFieldChange for keyword input', () => {
    render(<RuleFormModal {...defaultProps} />);

    const input = screen.getByLabelText('rules.form.keyword');
    fireEvent.change(input, { target: { value: 'BIEDRONKA' } });

    expect(mockHandleFieldChange).toHaveBeenCalledWith('keyword', 'BIEDRONKA');
  });

  it('clamps priority to minimum of 1', () => {
    render(<RuleFormModal {...defaultProps} />);

    const input = screen.getByLabelText('rules.form.priority');
    fireEvent.change(input, { target: { value: '-5' } });

    expect(mockHandleFieldChange).toHaveBeenCalledWith('priority', 1);
  });

  it('allows clearing priority before entering a new value', () => {
    render(<RuleFormModal {...defaultProps} />);

    const input = screen.getByLabelText('rules.form.priority');
    fireEvent.change(input, { target: { value: '' } });

    expect(mockHandleFieldChange).toHaveBeenCalledWith('priority', '');
  });

  it('orders cancel before the submit action', () => {
    render(<RuleFormModal {...defaultProps} />);

    const cancel = screen.getByText('rules.form.cancel');
    const submit = screen.getByText('rules.form.add');

    expect(
      cancel.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('gives both footer actions equal mobile width and touch target', () => {
    render(<RuleFormModal {...defaultProps} />);

    expect(screen.getByText('rules.form.cancel')).toHaveClass(
      'flex-1',
      'min-h-12',
    );
    expect(screen.getByText('rules.form.add')).toHaveClass(
      'flex-1',
      'min-h-12',
    );
  });

  it('passes numeric value for priority', () => {
    render(<RuleFormModal {...defaultProps} />);

    const input = screen.getByLabelText('rules.form.priority');
    fireEvent.change(input, { target: { value: '7' } });

    expect(mockHandleFieldChange).toHaveBeenCalledWith('priority', 7);
  });
});
