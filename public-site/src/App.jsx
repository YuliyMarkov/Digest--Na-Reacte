import { useState } from "react";
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ReelsModal from "./components/ReelsModal";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import NewsPage from "./pages/NewsPage";
import ScrollToTop from "./components/ScrollToTop";
import TopWidgets from "./components/TopWidgets";
import AboutPage from "./pages/AboutPage";
import ContactsPage from "./pages/ContactsPage";
import PrivacyPage from "./pages/PrivacyPage";
import NotFoundPage from "./pages/NotFoundPage";
import SearchPage from './pages/SearchPage'

function CategoryPageWrapper() {
  const { slug } = useParams();
  return <CategoryPage key={slug} />;
}

function NewsPageWrapper() {
  const { slug } = useParams();
  return <NewsPage key={slug} />;
}

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const open = (url) => {
    setVideoUrl(url);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setVideoUrl("");
  };

  return (
    <>
      <Header />
      <TopWidgets />
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Navigate to="/ru" replace />} />

        <Route path="/:lang" element={<HomePage onOpenReel={open} />} />
        <Route path="/:lang/category/:slug" element={<CategoryPageWrapper />} />
        <Route path="/:lang/news/:slug" element={<NewsPageWrapper />} />

        <Route path="/:lang/about" element={<AboutPage />} />
        <Route path="/:lang/contacts" element={<ContactsPage />} />
        <Route path="/:lang/privacy" element={<PrivacyPage />} />
        <Route path="/:lang/search" element={<SearchPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Footer />

      <ReelsModal isOpen={isOpen} videoUrl={videoUrl} onClose={close} />
    </>
  );
}

export default App;