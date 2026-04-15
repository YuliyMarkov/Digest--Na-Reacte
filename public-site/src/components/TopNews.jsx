import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/useLanguage";

function TopNews({
  featuredArticles = [],
  latestArticles = [],
  error = "",
}) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const uiText = {
    ru: {
      main: "Главное",
      latest: "Последние новости",
      empty: "Пока нет новостей",
      error: "Не удалось загрузить новости",
      prev: "Previous slide",
      next: "Next slide",
    },
    uz: {
      main: "Asosiy",
      latest: "So‘nggi yangiliklar",
      empty: "Hozircha yangiliklar yo‘q",
      error: "Yangiliklarni yuklab bo‘lmadi",
      prev: "Previous slide",
      next: "Next slide",
    },
  };

  const t = uiText[language] || uiText.ru;

  const sliderArticles = useMemo(
    () => featuredArticles.slice(0, 5),
    [featuredArticles]
  );

  const sidebarArticles = useMemo(
    () => latestArticles.slice(0, 8),
    [latestArticles]
  );

  const hasSlides = sliderArticles.length > 0;
  const safeIndex =
    hasSlides && currentIndex > sliderArticles.length - 1 ? 0 : currentIndex;
  const activeArticle = hasSlides ? sliderArticles[safeIndex] : null;

  const goToPrev = () => {
    if (sliderArticles.length <= 1) return;
    setCurrentIndex((prev) =>
      prev === 0 ? sliderArticles.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    if (sliderArticles.length <= 1) return;
    setCurrentIndex((prev) =>
      prev === sliderArticles.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section className="top-news">
      <div className="top-news-layout">
        <div className="top-news-left">
          <div className="top-news-header">
            <h2>{t.main}</h2>
          </div>

          {error ? (
            <div className="news-feed-empty">
              <p>{t.error}</p>
            </div>
          ) : !activeArticle ? (
            <div className="news-feed-empty">
              <p>{t.empty}</p>
            </div>
          ) : (
            <>
              <div className="top-news-slider">
                {sliderArticles.length > 1 && (
                  <button
                    type="button"
                    className="slider-btn prev"
                    onClick={goToPrev}
                    aria-label={t.prev}
                  >
                    ‹
                  </button>
                )}

                <div className="top-news-viewport">
                  <article className="top-slide">
                    <Link
                      to={`/${language}/news/${activeArticle.slug}`}
                      className="top-slide-link"
                      title={
                        activeArticle.translation?.seoTitle?.trim() ||
                        activeArticle.translation?.title ||
                        activeArticle.slug
                      }
                    >
                      {activeArticle.coverImage && (
                        <img
                          src={activeArticle.coverImage}
                          alt={
                            activeArticle.translation?.seoTitle?.trim() ||
                            activeArticle.translation?.title ||
                            activeArticle.slug
                          }
                          width="1200"
                          height="630"
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                        />
                      )}

                      <div className="top-slide-overlay">
                        <h3>
                          {activeArticle.translation?.title ||
                            activeArticle.slug}
                        </h3>
                      </div>
                    </Link>
                  </article>
                </div>

                {sliderArticles.length > 1 && (
                  <button
                    type="button"
                    className="slider-btn next"
                    onClick={goToNext}
                    aria-label={t.next}
                  >
                    ›
                  </button>
                )}
              </div>

              {sliderArticles.length > 1 && (
                <div className="top-news-dots">
                  {sliderArticles.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`top-news-dot ${
                        index === safeIndex ? "active" : ""
                      }`}
                      onClick={() => setCurrentIndex(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <aside className="top-news-sidebar">
          <h3>{t.latest}</h3>

          <div className="latest-news-box">
            {error ? (
              <ul>
                <li>{t.error}</li>
              </ul>
            ) : sidebarArticles.length === 0 ? (
              <ul>
                <li>{t.empty}</li>
              </ul>
            ) : (
              <ul>
                {sidebarArticles.map((article) => (
                  <li key={article.id}>
                    <Link to={`/${language}/news/${article.slug}`}>
                      {article.translation?.title || article.slug}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default TopNews;