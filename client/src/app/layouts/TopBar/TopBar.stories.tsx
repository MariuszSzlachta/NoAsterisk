import { MemoryRouter } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react';

import { TopBar } from '#app/layouts/TopBar/TopBar';
import { ThemeProvider } from '#app/providers/ThemeProvider';

const meta: Meta<typeof TopBar> = {
  title: 'app/layouts/TopBar',
  component: TopBar,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <ThemeProvider>
          <Story />
        </ThemeProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TopBar>;

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <TopBar breadcrumb="Pulpit" title="Pulpit" />
      <TopBar breadcrumb="Transakcje" title="Transakcje" />
    </div>
  ),
};
