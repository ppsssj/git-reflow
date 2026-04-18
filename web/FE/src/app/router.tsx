import { Navigate, createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { TemplateEditorPage } from '../features/editor/TemplateEditorPage';
import { IntroPage } from '../features/intro/IntroPage';
import { TemplateListPage } from '../features/templates/TemplateListPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <IntroPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/templates',
    element: <TemplateListPage />,
  },
  {
    path: '/templates/:templateId',
    element: <TemplateEditorPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

