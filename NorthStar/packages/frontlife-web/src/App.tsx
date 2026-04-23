import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import PageLayout from './components/layout/PageLayout';
import { api } from './services/api';
import { useUserStore } from './store/useUserStore';
import HomePage from './pages/HomePage';
import SearchResultPage from './pages/SearchResultPage';
import ExplorePage from './pages/ExplorePage';
import SpacePage from './pages/SpacePage';
import ArticlePage from './pages/ArticlePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function page(element: ReactElement) {
  return <ErrorBoundary>{element}</ErrorBoundary>;
}

export default function App() {
  const setPermissions = useUserStore((state) => state.setPermissions);

  useEffect(() => {
    api.getPermissions().then(setPermissions).catch(() => undefined);
  }, [setPermissions]);

  return (
    <>
      <ScrollToTop />
      <PageLayout>
        <Routes>
          <Route path="/" element={page(<HomePage />)} />
          <Route path="/search" element={page(<SearchResultPage />)} />
          <Route path="/explore" element={page(<ExplorePage />)} />
          <Route path="/space/:id" element={page(<SpacePage />)} />
          <Route path="/article/:id" element={page(<ArticlePage />)} />
          <Route path="/me" element={page(<ProfilePage />)} />
          <Route path="/login" element={page(<LoginPage />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageLayout>
    </>
  );
}
