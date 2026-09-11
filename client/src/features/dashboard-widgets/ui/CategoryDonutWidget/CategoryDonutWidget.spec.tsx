import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CategoryDonutWidget } from './CategoryDonutWidget';

vi.mock('#shared/adapters/charts', () => ({
  PieChart: (): React.JSX.Element => <div data-testid="pie-chart" />,
}));

describe('CategoryDonutWidget', () => {
  it('centers the chart and legend group on desktop', () => {
    const { container } = render(
      <CategoryDonutWidget
        data={[{ label: 'Spożywcze', value: 100 }]}
        title="Wydatki wg kategorii"
      />,
    );

    const content = container.querySelector('[data-testid="pie-chart"]')
      ?.parentElement?.parentElement;
    const legend = container.querySelector('ul');

    expect(content).toHaveClass('lg:justify-center');
    expect(legend).toHaveClass('lg:w-[180px]', 'lg:flex-none');
  });
});
