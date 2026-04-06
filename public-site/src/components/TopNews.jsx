import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/useLanguage";

function TopNews({
  featuredArticles = [],
  latestArticles = [],
  error = "",
}) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef(null);
  const startXRef = useRef(null);
  const deltaXRef = useRef(0);

  const uiText = {
    ru: {
      main: "Главное",
      latest: "Последние новости",
      empty: "Пока нет новостей",
      error: "Не удалось загрузить новости",
    },
    uz: {
      main: "Asosiy",
      latest: "So‘nggi yangiliklar",
      empty: "Hozircha yangiliklar yo‘q",
      error: "Yangiliklarni yuklab bo‘lmadi",
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

  useEffect(() => {
    if (sliderArticles.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === sliderArticles.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [sliderArticles]);

  const goToPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? sliderArticles.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === sliderArticles.length - 1 ? 0 : prev + 1
    );
  };

  const handleTouchStart = (event) => {
    startXRef.current = event.touches[0].clientX;
    deltaXRef.current = 0;
  };

  const handleTouchMove = (event) => {
    if (startXRef.current === null) return;
    deltaXRef.current = event.touches[0].clientX - startXRef.current;
  };

  const handleTouchEnd = () => {
    if (startXRef.current === null) return;

    if (deltaXRef.current > 50) {
      goToPrev();
    } else if (deltaXRef.current < -50) {
      goToNext();
    }

    startXRef.current = null;
    deltaXRef.current = 0;
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
          ) : sliderArticles.length === 0 ? (
            <div className="news-feed-empty">
              <p>{t.empty}</p>
            </div>
          ) : (
            <>
              <div className="top-news-slider">
                <button
                  type="button"
                  className="slider-btn prev"
                  onClick={goToPrev}
                  aria-label="Previous slide"
                >
                  ‹
                </button>

                <div
                  className="top-news-viewport"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="top-news-track"
                    ref={trackRef}
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                  >
                    {sliderArticles.map((article, index) => {
                      const title = article.translation?.title || article.slug;
                      const seoTitle =
                        article.translation?.seoTitle?.trim() || title;

                      return (
                        <article className="top-slide" key={article.id}>
                          <Link
                            to={`/${language}/news/${article.slug}`}
                            className="top-slide-link"
                            title={seoTitle}
                          >
                            {article.coverImage && (
                              <img
                                src={article.coverImage}
                                alt={seoTitle}
                                loading={index === 0 ? "eager" : "lazy"}
                                fetchpriority={
                                  index === 0 ? "high" : "auto"
                                }
                                decoding="async"
                              />
                            )}
                            <div className="top-slide-overlay">
                              <h3>{title}</h3>
                            </div>
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  className="slider-btn next"
                  onClick={goToNext}
                  aria-label="Next slide"
                >
                  ›
                </button>
              </div>

              {sliderArticles.length > 1 && (
                <div className="top-news-dots">
                  {sliderArticles.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`top-news-dot ${
                        index === currentIndex ? "active" : ""
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