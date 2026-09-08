import { RouterProvider } from 'react-router-dom';

import { router } from '#app/routing/routes';

export const AppRouter = (): React.JSX.Element => {
  return <RouterProvider router={router} />;
};
