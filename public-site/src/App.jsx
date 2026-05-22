import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Loader from "./components/Loader";
import YandexFullscreenAd from "./components/YandexFullscreenAd";
import YandexFullscreenDesktopAd from "./components/YandexFullscreenDesktopAd";
import YandexFloorDesktopAd from "./components/YandexFloorDesktopAd";
import YandexFloorMobileAd from "./components/YandexFloorMobileAd";

const TopWidgets = lazy(() => import("./components/TopWidgets"));
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
  const [showTopWidgets, setShowTopWidgets] = useState(false);

  useEffect(() => {
    let timeoutId;
    let idleId;

    const enableWidgets = () => {
      setShowTopWidgets(true);
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(enableWidgets, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(enableWidgets, 1200);
    }

    return () => {
      if (idleId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

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
      <YandexFullscreenAd />
      <YandexFullscreenDesktopAd />
      <YandexFloorDesktopAd />
      <YandexFloorMobileAd />

      <ScrollToTop />
      <Header />

      {showTopWidgets ? (
        <Suspense fallback={null}>
          <TopWidgets />
        </Suspense>
      ) : null}

      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/ru" replace />} />

          <Route path="/:lang" element={<HomePage onOpenReel={open} />} />
          <Route
            path="/:lang/category/:slug"
            element={<CategoryPageWrapper />}
          />
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
