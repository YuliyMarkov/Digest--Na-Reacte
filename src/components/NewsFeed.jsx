import { Link } from "react-router-dom";
import { featuredNews } from "../data/homePageData";
import { useLanguage } from "../context/useLanguage";
import { getLocalizedValue } from "../utils/getLocalizedValue";

function NewsFeed() {
  const { language } = useLanguage();

  const uiText = {
    ru: {
      title: "Новости Узбекистана",
      more: "Смотреть ещё",
    },
    uz: {
      title: "O‘zbekiston yangiliklari",
      more: "Yana ko‘rish",
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

        <div className="news-feed">
          {featuredNews.slice(0, 6).map((item, index) => {
            const title = getLocalizedValue(item.title, language);
            const text = getLocalizedValue(item.text, language);

            return (
              <article className="news-card" key={index}>
                <Link
                  to={`/${language}/news/${item.slug}`}
                  className="news-card-link"
                >
                  <img
                    src={item.image}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    width="800"
                    height="450"
                  />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

export default NewsFeed;