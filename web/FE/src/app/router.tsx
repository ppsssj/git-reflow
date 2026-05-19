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
    path: '/templates/discover',
    element: <TemplateListPage />,
  },
  {
    path: '/templates/favorites',
    element: <TemplateListPage />,
  },
  {
    path: '/templates/imported',
    element: <TemplateListPage />,
  },
  {
    path: '/templates/published',
    element: <TemplateListPage />,
  },
  {
    path: '/templates/usage',
    element: <TemplateListPage />,
  },
  {
    path: '/templates/network/:networkTemplateId',
    element: <TemplateEditorPage />,
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
