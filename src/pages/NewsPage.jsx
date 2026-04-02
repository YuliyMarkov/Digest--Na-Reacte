import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { newsData } from "../data/newsData";
import { latestNews, moreNewsInitial } from "../data/homePageData";
import { useLanguage } from "../context/useLanguage";
import { getLocalizedValue } from "../utils/getLocalizedValue";
import AdBlock from "../components/AdBlock";
import Loader from "../components/Loader";
import Seo from "../components/Seo";

function NewsPage() {
  const { slug } = useParams();
  const { language } = useLanguage();

  const article = newsData[slug] || null;

  const [reactions, setReactions] = useState({
    fire: 124,
    heart: 89,
    laugh: 37,
    neutral: 21,
    angry: 12,
  });

  const [selectedReaction, setSelectedReaction] = useState(null);

  const uiText = {
    ru: {
      notFoundTitle: "Новость не найдена",
      notFoundText: "Такой статьи пока нет или ссылка устарела.",
      backHome: "Вернуться на главную",
      home: "Главная",
      latest: "Последние новости",
      allNews: "Все новости",
      showMore: "Смотреть ещё",
      reactionsTitle: "Как вам новость?",
      share: "Поделиться новостью",
      telegramSubscribe: "Подписывайтесь на наш Telegram",
      telegramSubtitle:
        "Самые важные новости Узбекистана и мира — быстро, коротко и по делу.",
      fallbackDescription:
        "Свежая новость на сайте «Дайджест». Подробности, фото и актуальная информация.",
    },
    uz: {
      notFoundTitle: "Yangilik topilmadi",
      notFoundText: "Bunday maqola hozircha yo‘q yoki havola eskirgan.",
      backHome: "Bosh sahifaga qaytish",
      home: "Bosh sahifa",
      latest: "So‘nggi yangiliklar",
      allNews: "Barcha yangiliklar",
      showMore: "Yana ko‘rish",
      reactionsTitle: "Yangilik sizga qanday?",
      share: "Yangilikni ulashish",
      telegramSubscribe: "Telegram kanalimizga obuna bo‘ling",
      telegramSubtitle:
        "O‘zbekiston va dunyoning eng muhim yangiliklari — tez, qisqa va aniq.",
      fallbackDescription:
        "«Dayjest» saytida yangi yangilik. Batafsil ma’lumot, suratlar va dolzarb tafsilotlar.",
    },
  };

  const t = uiText[language] || uiText.ru;

  if (!article) {
    return (
      <main className="main container">
        <Seo
          title={t.notFoundTitle}
          description={t.notFoundText}
          canonical={`/${language}/news/${slug}`}
          type="article"
        />

        <section className="article-page">
          <h1>{t.notFoundTitle}</h1>
          <p>{t.notFoundText}</p>
          <Link to={`/${language}`}>{t.backHome}</Link>
        </section>
      </main>
    );
  }

  const localizedCategory = getLocalizedValue(article.category, language);
  const localizedTitle = getLocalizedValue(article.title, language);
  const localizedDate = getLocalizedValue(article.date, language);
  const localizedContent =
    getLocalizedValue(article.content, language) ||
    getLocalizedValue(article.content, "ru") ||
    [];

  const categorySlugMap = {
    Узбекистан: "uzbekistan",
    Мир: "world",
    Авто: "auto",
    Происшествия: "incidents",
    Наука: "science",
    Экономика: "economy",
  };

  const categorySlug =
    categorySlugMap[getLocalizedValue(article.category, "ru")] || "uzbekistan";

  const shareUrl = window.location.href;
  const shareTitle = localizedTitle;

  const shareLinks = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`,
  };

  const handleReactionClick = (key) => {
    if (selectedReaction === key) return;

    setReactions((prev) => ({
      ...prev,
      [key]: prev[key] + 1,
    }));

    setSelectedReaction(key);
  };

  const descriptionFromContent =
    localizedContent.find(
      (paragraph) => typeof paragraph === "string" && paragraph.trim().length > 0
    ) || t.fallbackDescription;

  const seoDescription =
    descriptionFromContent.length > 160
      ? `${descriptionFromContent.slice(0, 157)}...`
      : descriptionFromContent;

  const canonical = `/${language}/news/${slug}`;

  const publishedDateIso = article.publishedAt || article.datePublished || null;
  const modifiedDateIso =
    article.updatedAt || article.dateModified || publishedDateIso || null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: localizedTitle,
    description: seoDescription,
    image: [
      article.image.startsWith("http")
        ? article.image
        : `https://digestnews.uz${article.image}`,
    ],
    author: {
      "@type": "Organization",
      name: "Дайджест",
    },
    publisher: {
      "@type": "Organization",
      name: "Дайджест",
      logo: {
        "@type": "ImageObject",
        url: "https://digestnews.uz/New_Logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "__PAGE_URL__",
    },
    ...(publishedDateIso ? { datePublished: publishedDateIso } : {}),
    ...(modifiedDateIso ? { dateModified: modifiedDateIso } : {}),
  };

  return (
    <main className="main container">
      <Seo
        title={localizedTitle}
        description={seoDescription}
        canonical={canonical}
        image={article.image}
        type="article"
        schema={schema}
      />

      <section className="article-page">
        <div className="breadcrumbs">
          <Link to={`/${language}`}>{t.home}</Link> /{" "}
          <Link to={`/${language}/category/${categorySlug}`}>
            {localizedCategory}
          </Link>{" "}
          / <span>{localizedTitle}</span>
        </div>

        <div className="article-layout">
          <article className="article-main">
            <div className="article-meta">
              <span className="article-category">{localizedCategory}</span>
              <span className="article-date">{localizedDate}</span>
            </div>

            <h1>{localizedTitle}</h1>

            <img src={article.image} alt={localizedTitle} />

            {localizedContent.map((paragraph, index) => (
              <div key={index}>
                <p>{paragraph}</p>
                {index === 1 && <AdBlock className="article-inline-ad" />}
              </div>
            ))}

            <div className="article-extra">
              <section className="article-reactions" aria-label="Реакции">
                <div className="article-extra-title">{t.reactionsTitle}</div>

                <div className="article-reactions-row">
                  <button
                    type="button"
                    className={`reaction-btn ${selectedReaction === "fire" ? "active" : ""}`}
                    onClick={() => handleReactionClick("fire")}
                  >
                    <span className="reaction-emoji">🔥</span>
                    <span className="reaction-count">{reactions.fire}</span>
                  </button>

                  <button
                    type="button"
                    className={`reaction-btn ${selectedReaction === "heart" ? "active" : ""}`}
                    onClick={() => handleReactionClick("heart")}
                  >
                    <span className="reaction-emoji">❤️</span>
                    <span className="reaction-count">{reactions.heart}</span>
                  </button>

                  <button
                    type="button"
                    className={`reaction-btn ${selectedReaction === "laugh" ? "active" : ""}`}
                    onClick={() => handleReactionClick("laugh")}
                  >
                    <span className="reaction-emoji">😂</span>
                    <span className="reaction-count">{reactions.laugh}</span>
                  </button>

                  <button
                    type="button"
                    className={`reaction-btn ${selectedReaction === "neutral" ? "active" : ""}`}
                    onClick={() => handleReactionClick("neutral")}
                  >
                    <span className="reaction-emoji">😐</span>
                    <span className="reaction-count">{reactions.neutral}</span>
                  </button>

                  <button
                    type="button"
                    className={`reaction-btn ${selectedReaction === "angry" ? "active" : ""}`}
                    onClick={() => handleReactionClick("angry")}
                  >
                    <span className="reaction-emoji">😡</span>
                    <span className="reaction-count">{reactions.angry}</span>
                  </button>
                </div>
              </section>

              <section className="article-share-line" aria-label="Поделиться">
                <span className="article-share-label">{t.share}</span>

                <div className="article-share-links">
                  <a
                    href={shareLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="article-share-link telegram"
                  >
                    Telegram
                  </a>

                  <a
                    href={shareLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="article-share-link facebook"
                  >
                    Facebook
                  </a>

                  <a
                    href={shareLinks.threads}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="article-share-link threads"
                  >
                    Threads
                  </a>
                </div>
              </section>

              <a
                href="https://t.me/+rI4mVrzYphxkZGYy"
                target="_blank"
                rel="noopener noreferrer"
                className="article-telegram-subscribe"
              >
                <div className="article-telegram-icon">
                  <img src="/Icons/TG-icon.svg" alt="Telegram" />
                </div>

                <div className="article-telegram-text">
                  <div className="article-telegram-title">
                    {t.telegramSubscribe}
                  </div>
                  <div className="article-telegram-subtitle">
                    {t.telegramSubtitle}
                  </div>
                </div>
              </a>
            </div>
          </article>

          <aside className="top-news-sidebar">
            <h3>{t.latest}</h3>

            <div className="latest-news-box">
              <ul>
                {latestNews.map((item, index) => (
                  <li key={index}>
                    <Link to={`/${language}/news/${item.slug}`}>
                      {getLocalizedValue(item.title, language)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <AdBlock />

      <section className="more-news-section">
        <div className="news-feed-header">
          <h2>{t.allNews}</h2>

          <Link to={`/${language}`} className="news-more">
            {t.showMore} <span className="arrow">→</span>
          </Link>
        </div>

        <div className="more-news-grid">
          {moreNewsInitial.map((item, index) => {
            const title = getLocalizedValue(item.title, language);
            const text = getLocalizedValue(item.text, language);

            return (
              <article className="more-news-card" key={index}>
                <Link
                  to={`/${language}/news/${item.slug}`}
                  className="more-news-card-link"
                >
                  <img src={item.image} alt={title} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default NewsPage;