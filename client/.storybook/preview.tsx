import type { Decorator, Preview } from '@storybook/react';

import '../src/shared/i18n/i18n';
import '../src/index.css';

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals['theme'] ?? 'dark';
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.classList.toggle('dark', theme === 'dark');

  return (
    <div className="bg-background p-4 text-foreground">
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        items: ['dark', 'light'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
};

export default preview;
