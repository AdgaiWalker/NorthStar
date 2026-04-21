import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import PageLayout from './components/layout/PageLayout';
import HomePage from './pages/HomePage';
import KBListPage from './pages/KBListPage';
import KBDetailPage from './pages/KBDetailPage';
import PostDetailPage from './pages/PostDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import ProfilePage from './pages/ProfilePage';
import WritePage from './pages/WritePage';
import SearchOverlay from './components/SearchOverlay';
import CreateMenuOverlay from './components/CreateMenuOverlay';
import PostPreviewModal from './components/PostPreviewModal';
import { useAppStore } from './store/useAppStore';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const showSearch = useAppStore((s) => s.showSearch);
  const showCreateMenu = useAppStore((s) => s.showCreateMenu);
  const showPostPreview = useAppStore((s) => s.showPostPreview);

  return (
    <>
      <ScrollToTop />
      <PageLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kb" element={<KBListPage />} />
          <Route path="/kb/:kbId" element={<KBDetailPage />} />
          <Route path="/kb/:kbId/:articleId" element={<KBDetailPage />} />
          <Route path="/post/:postId" element={<PostDetailPage />} />
          <Route path="/post/create" element={<CreatePostPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/write" element={<WritePage />} />
        </Routes>
      </PageLayout>
      {showSearch && <SearchOverlay />}
      {showCreateMenu && <CreateMenuOverlay />}
      {showPostPreview && <PostPreviewModal />}
    </>
  );
}
