import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/useLanguage";
import YandexFeedAd from "./YandexFeedAd";

const batchSize = 4;

function MoreNews({ articles = [], error = "" }) {
  const { language } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(batchSize);

  const uiText = {
    ru: {
      allNews: "Все новости",
      loadMore: "Больше новостей",
      empty: "Пока нет новостей",
      error: "Не удалось загрузить новости",
    },
    uz: {
      allNews: "Barcha yangiliklar",
      loadMore: "Ko‘proq yangilik",
      empty: "Hozircha yangiliklar yo‘q",
      error: "Yangiliklarni yuklab bo‘lmadi",
    },
  };

  const t = uiText[language] || uiText.ru;

  const safeVisibleCount = Math.min(visibleCount, articles.length || batchSize);
  const visibleNews = articles.slice(0, safeVisibleCount);
  const hasMore = safeVisibleCount < articles.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + batchSize, articles.length));
  };

  return (
    <section className="more-news-section">
      <div className="more-news-header">
        <h2>{t.allNews}</h2>
      </div>

      {error ? (
        <div className="more-news-empty">
          <p>{t.error}</p>
        </div>
      ) : visibleNews.length === 0 ? (
        <div className="more-news-empty">
          <p>{t.empty}</p>
        </div>
      ) : (
        <>
          <div className="more-news-grid">
            {visibleNews.map((article, index) => {
              const title = article.translation?.title || article.slug;
              const seoTitle = article.translation?.seoTitle?.trim() || "";
              const alt = seoTitle || title;
              const text = article.translation?.excerpt || "";

              return (
                <Fragment key={article.id}>
                  <article className="more-news-card">
                    <Link
                      to={`/${language}/news/${article.slug}`}
                      className="more-news-card-link"
                      title={alt}
                    >
                      {article.coverImage && (
                        <img
                          src={article.coverImage}
                          alt={alt}
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                          width="800"
                          height="450"
                        />
                      )}

                      <h3>{title}</h3>
                      <p>{text}</p>
                    </Link>
                  </article>

                  {index === 2 && <YandexFeedAd />}
                </Fragment>
              );
            })}
          </div>

          {hasMore && (
            <div className="more-news-action">
              <button
                className="more-news-button"
                type="button"
                onClick={handleLoadMore}
              >
                {t.loadMore}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default MoreNews;