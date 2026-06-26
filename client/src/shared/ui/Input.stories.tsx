import type { Meta, StoryObj } from '@storybook/react';

import { Input } from '#shared/ui/Input';

const SearchIcon = (): React.JSX.Element => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" />
  </svg>
);

const meta: Meta<typeof Input> = {
  title: 'shared/ui/Input',
  component: Input,
  argTypes: {
    icon: { table: { disable: true } },
  },
  decorators: [(Story) => <div className="w-72"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: 'Wpisz tekst...' },
};

export const WithLabel: Story = {
  args: { label: 'Email', placeholder: 'jan@example.pl', type: 'email' },
};

export const WithError: Story = {
  args: { label: 'Kwota', value: '-100', error: 'Kwota musi być dodatnia' },
};

export const WithIcon: Story = {
  args: { placeholder: 'Szukaj transakcji...', icon: <SearchIcon /> },
};

export const Disabled: Story = {
  args: { label: 'Zablokowane', value: 'Nie można edytować', disabled: true },
};
