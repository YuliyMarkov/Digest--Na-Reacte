import { Link } from "react-router-dom";
import { useLanguage } from "../context/useLanguage";

function NewsFeed({ articles = [], error = "" }) {
  const { language } = useLanguage();

  const uiText = {
    ru: {
      title: "Новости Узбекистана",
      more: "Смотреть ещё",
      empty: "Пока нет новостей",
      error: "Не удалось загрузить новости",
    },
    uz: {
      title: "O‘zbekiston yangiliklari",
      more: "Yana ko‘rish",
      empty: "Hozircha yangiliklar yo‘q",
      error: "Yangiliklarni yuklab bo‘lmadi",
    },
  };

  const t = uiText[language] || uiText.ru;

  return (
    <section className="content-grid">
      <section className="news-feed-section">
        <div className="news-feed-header">
          <h2>{t.title}</h2>
          <Link to={`/${language}/category/uzbekistan`} className="news-more">
            {t.more} <span className="arrow">→</span>
          </Link>
        </div>

        {error ? (
          <div className="news-feed-empty">
            <p>{t.error}</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="news-feed-empty">
            <p>{t.empty}</p>
          </div>
        ) : (
          <div className="news-feed">
            {articles.slice(0, 6).map((article) => {
              const title = article.translation?.title || article.slug;
              const seoTitle = article.translation?.seoTitle?.trim() || "";
              const alt = seoTitle || title;
              const text = article.translation?.excerpt || "";

              return (
                <article className="news-card" key={article.id}>
                  <Link
                    to={`/${language}/news/${article.slug}`}
                    className="news-card-link"
                    title={alt}
                  >
                    {article.coverImage && (
                      <img
                        src={article.coverImage}
                        alt={alt}
                        loading="lazy"
                        decoding="async"
                        width="800"
                        height="450"
                      />
                    )}
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

export default NewsFeed;