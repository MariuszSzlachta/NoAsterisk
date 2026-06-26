import type { Preview, Decorator } from '@storybook/react';
import '../src/index.css';

const withDarkMode: Decorator = (Story, context) => {
  const dark = context.globals['theme'] === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  return <Story />;
};

const preview: Preview = {
  decorators: [withDarkMode],
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
};

export default preview;
