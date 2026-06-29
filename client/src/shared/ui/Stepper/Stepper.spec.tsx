import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Stepper } from './Stepper';

const STEPS = [
  { label: 'Upload' },
  { label: 'Mapowanie' },
  { label: 'Anonimizacja' },
  { label: 'Podgląd' },
  { label: 'Import' },
];

describe('Stepper', () => {
  it('renders all step labels', () => {
    render(<Stepper steps={STEPS} currentStep={0} />);

    STEPS.forEach((step) => {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    });
  });

  it('marks current step with aria-current', () => {
    render(<Stepper steps={STEPS} currentStep={2} />);

    expect(screen.getByText('3').closest('[aria-current]')).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('shows checkmark for completed steps', () => {
    const { container } = render(<Stepper steps={STEPS} currentStep={3} />);

    // Steps 0,1,2 are completed — no text numbers for them
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    // SVG checkmarks rendered
    expect(container.querySelectorAll('svg')).toHaveLength(3);
  });

  it('shows number for future steps', () => {
    render(<Stepper steps={STEPS} currentStep={1} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders connecting lines between steps', () => {
    const { container } = render(<Stepper steps={STEPS} currentStep={0} />);

    // 4 connecting lines for 5 steps
    expect(container.querySelectorAll('.h-px')).toHaveLength(4);
  });
});
