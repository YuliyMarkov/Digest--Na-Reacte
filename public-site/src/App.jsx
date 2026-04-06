import { Suspense, lazy, useState } from "react";
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import TopWidgets from "./components/TopWidgets";
import Loader from "./components/Loader";

const ReelsModal = lazy(() => import("./components/ReelsModal"));
const HomePage = lazy(() => import("./pages/HomePage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));

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

      <Suspense fallback={<Loader />}>
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

        <ReelsModal isOpen={isOpen} videoUrl={videoUrl} onClose={close} />
      </Suspense>

      <Footer />
    </>
  );
}

export default App;