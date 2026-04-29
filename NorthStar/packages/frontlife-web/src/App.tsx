import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import PageLayout from './components/layout/PageLayout';
import SearchOverlay from './components/SearchOverlay';
import { api } from './services/api';
import { useUserStore } from './store/useUserStore';
import { useUIStore } from './store/useUIStore';
import HomePage from './pages/HomePage';
import SearchResultPage from './pages/SearchResultPage';
import ExplorePage from './pages/ExplorePage';
import SpacePage from './pages/SpacePage';
import ArticlePage from './pages/ArticlePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import LegalDocumentPage from './pages/LegalDocumentPage';

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
  const token = useUserStore((state) => state.token);
  const setIdentityUser = useUserStore((state) => state.setIdentityUser);
  const setPermissions = useUserStore((state) => state.setPermissions);
  const showSearch = useUIStore((state) => state.showSearch);

  useEffect(() => {
    if (token) {
      api
        .getIdentityMe()
        .then((result) => setIdentityUser(result.user))
        .catch(() => undefined);
    } else {
      setIdentityUser(null);
    }

    api
      .getPermissions()
      .then(setPermissions)
      .catch(() => undefined);
  }, [setIdentityUser, setPermissions, token]);

  return (
    <>
      <ScrollToTop />
      <SearchOverlay />
      <PageLayout>
        <Routes>
          <Route path="/" element={page(<HomePage />)} />
          <Route path="/search" element={page(<SearchResultPage />)} />
          <Route path="/explore" element={page(<ExplorePage />)} />
          <Route path="/space/:id" element={page(<SpacePage />)} />
          <Route path="/article/:id" element={page(<ArticlePage />)} />
          <Route path="/me" element={page(<ProfilePage />)} />
          <Route path="/login" element={page(<LoginPage />)} />
          <Route path="/legal/terms" element={page(<LegalDocumentPage type="terms" />)} />
          <Route path="/legal/privacy" element={page(<LegalDocumentPage type="privacy" />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageLayout>
    </>
  );
}
