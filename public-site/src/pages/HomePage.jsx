import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import TopNews from "../components/TopNews";
import { useLanguage } from "../context/useLanguage";
import Seo from "../components/Seo";

const NewsFeed = lazy(() => import("../components/NewsFeed"));
const ReelsSection = lazy(() => import("../components/ReelsSection"));
const MoreNews = lazy(() => import("../components/MoreNews"));
const AdBlock = lazy(() => import("../components/AdBlock"));

const API_BASE_URL = "https://digest-news.uz";

function HomePage({ onOpenReel }) {
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState("");
  const [showBelowFold, setShowBelowFold] = useState(false);

  const seoContent = {
    ru: {
      title: "Новости Узбекистана и мира",
      description:
        "Свежие новости Узбекистана и мира: политика, экономика, происшествия и технологии.",
    },
    uz: {
      title: "O‘zbekiston va dunyo yangiliklari",
      description:
        "O‘zbekiston va dunyodagi eng so‘nggi yangiliklar: siyosat, iqtisodiyot va texnologiyalar.",
    },
  };

  const t = seoContent[language] || seoContent.ru;
  const locale = language === "uz" ? "uz_UZ" : "ru_RU";
  const canonical = `/${language}`;

  useEffect(() => {
    const controller = new AbortController();

    async function loadHomeArticles() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/articles?lang=${encodeURIComponent(language)}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error("Failed to load articles");
        }

        setArticles(data.articles || []);
      } catch (err) {
        if (err.name === "AbortError") return;

        setArticles([]);
        setError("Failed to load articles");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadHomeArticles();

    return () => {
      controller.abort();
    };
  }, [language]);

  useEffect(() => {
    let timeoutId;
    let idleId;

    setShowBelowFold(false);

    const enableBelowFold = () => {
      setShowBelowFold(true);
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(enableBelowFold, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(enableBelowFold, 1200);
    }

    return () => {
      if (idleId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [language]);

  const {
    featuredArticles,
    latestArticles,
    newsFeedArticles,
    moreNewsArticles,
  } = useMemo(() => {
    const featured = articles.filter((article) => article.isFeatured);
    const nonFeatured = articles.filter((article) => !article.isFeatured);

    const uzbekistanNews = nonFeatured.filter(
      (article) => article.category?.slug === "uzbekistan"
    );

    const featuredArticles =
      featured.length > 0 ? featured.slice(0, 5) : articles.slice(0, 5);

    const latestArticles = articles.slice(0, 8);
    const newsFeedArticles = uzbekistanNews.slice(0, 8);

    const featuredIds = new Set(featuredArticles.map((article) => article.id));
    const uzbekistanIds = new Set(newsFeedArticles.map((article) => article.id));

    const moreNewsArticles = nonFeatured.filter(
      (article) => !featuredIds.has(article.id) && !uzbekistanIds.has(article.id)
    );

    return {
      featuredArticles,
      latestArticles,
      newsFeedArticles,
      moreNewsArticles,
    };
  }, [articles]);

  const firstImage = featuredArticles[0]?.coverImage || "";
  const componentError = loading ? "" : error;

  return (
    <main className="main container">
      <Seo
        title={t.title}
        description={t.description}
        canonical={canonical}
        locale={locale}
        image="/preview.jpg"
        preloadImage={firstImage}
      />

      <TopNews
        featuredArticles={featuredArticles}
        latestArticles={latestArticles}
        error={componentError}
      />

      {showBelowFold ? (
        <Suspense fallback={null}>
          <AdBlock />
          <NewsFeed articles={newsFeedArticles} error={componentError} />
          <ReelsSection onOpenReel={onOpenReel} />
          <AdBlock />
          <MoreNews articles={moreNewsArticles} error={componentError} />
        </Suspense>
      ) : null}
    </main>
  );
}

export default HomePage;