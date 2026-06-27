import type { Meta, StoryObj } from '@storybook/react';

import { Input } from '#shared/ui/Input';

const SearchIcon = (): React.JSX.Element => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" />
  </svg>
);

const meta: Meta<typeof Input> = {
  title: 'shared/ui/Input',
  component: Input,
  argTypes: {
    icon: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Showcase: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-6">
      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Default
        </h3>
        <Input placeholder="Wpisz tekst..." />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          With label
        </h3>
        <Input label="Email" placeholder="jan@example.pl" type="email" />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          With error
        </h3>
        <Input label="Kwota" value="-100" error="Kwota musi być dodatnia" />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          With icon
        </h3>
        <Input placeholder="Szukaj transakcji..." icon={<SearchIcon />} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Disabled
        </h3>
        <Input label="Zablokowane" value="Nie można edytować" disabled />
      </section>
    </div>
  ),
};
