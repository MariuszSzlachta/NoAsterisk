import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { ThemeProvider } from '#app/providers/ThemeProvider';

import { TopBar } from './TopBar';

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

export const Dashboard: Story = {
  args: {
    breadcrumb: 'Pulpit',
    title: 'Pulpit',
  },
};

export const Transactions: Story = {
  args: {
    breadcrumb: 'Transakcje',
    title: 'Transakcje',
  },
};
