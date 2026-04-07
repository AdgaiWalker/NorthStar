import React from 'react';
import { RouteObject } from 'react-router-dom';
import { CampusHomePage } from './pages/CampusHomePage';
import { CategoryPage } from './pages/CategoryPage';
import { CampusArticlePage } from './pages/CampusArticlePage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <CampusHomePage />,
  },
  {
    path: '/category/:slug',
    element: <CategoryPage />,
  },
  {
    path: '/article/:id',
    element: <CampusArticlePage />,
  },
];
