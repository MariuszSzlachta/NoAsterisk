import { RouterProvider } from 'react-router-dom';

import { router } from '#app/routing/routes';

export function AppRouter(): React.JSX.Element {
  return <RouterProvider router={router} />;
}
