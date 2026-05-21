import type { ReactNode } from 'react';
import { Navigate, createBrowserRouter, useLocation } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { TemplateEditorPage } from '../features/editor/TemplateEditorPage';
import { IntroPage } from '../features/intro/IntroPage';
import { TemplateListPage } from '../features/templates/TemplateListPage';
import { isAuthenticated } from '../lib/auth';

function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}

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
    element: <RequireAuth><TemplateListPage /></RequireAuth>,
  },
  {
    path: '/templates/discover',
    element: <RequireAuth><TemplateListPage /></RequireAuth>,
  },
  {
    path: '/templates/favorites',
    element: <RequireAuth><TemplateListPage /></RequireAuth>,
  },
  {
    path: '/templates/imported',
    element: <RequireAuth><TemplateListPage /></RequireAuth>,
  },
  {
    path: '/templates/published',
    element: <RequireAuth><TemplateListPage /></RequireAuth>,
  },
  {
    path: '/templates/usage',
    element: <RequireAuth><TemplateListPage /></RequireAuth>,
  },
  {
    path: '/templates/network/:networkTemplateId',
    element: <RequireAuth><TemplateEditorPage /></RequireAuth>,
  },
  {
    path: '/templates/:templateId',
    element: <RequireAuth><TemplateEditorPage /></RequireAuth>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
