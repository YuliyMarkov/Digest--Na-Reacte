import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../context/useLanguage";
import AdBlock from "../components/AdBlock";
import Loader from "../components/Loader";
import Seo from "../components/Seo";

const API_BASE_URL = "http://localhost:4000";

function formatArticleDate(dateString, language) {
  if (!dateString) return "";

  try {
    return new Intl.DateTimeFormat(language === "uz" ? "uz-UZ" : "ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return "";
  }
}

function getCategoryName(category, language) {
  if (!category) return "";
  return language === "uz" ? category.nameUz : category.nameRu;
}

function splitContentToParagraphs(content) {
  if (!content || typeof content !== "string") return [];

  return content
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function NewsPage() {
  const { slug } = useParams();
  const { language } = useLanguage();

  const [article, setArticle] = useState(null);
  const [latestArticles, setLatestArticles] = useState([]);
  const [moreArticles, setMoreArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [reactionLoading, setReactionLoading] = useState(false);

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
      loadError: "Не удалось загрузить новость.",
      latestError: "Не удалось загрузить новости.",
      alreadyReacted: "Вы уже отреагировали на эту новость.",
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
      loadError: "Yangilikni yuklab bo‘lmadi.",
      latestError: "Yangiliklarni yuklab bo‘lmadi.",
      alreadyReacted: "Siz bu yangilikka allaqachon reaksiya bildirgansiz.",
    },
  };

  const t = uiText[language] || uiText.ru;
  const locale = language === "uz" ? "uz_UZ" : "ru_RU";

  useEffect(() => {
    let isMounted = true;

    async function loadArticle() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/articles/${encodeURIComponent(
            slug
          )}?lang=${encodeURIComponent(language)}`
        );

        const data = await response.json();

        if (response.status === 404) {
          if (isMounted) {
            setArticle(null);
            setError("not-found");
          }
          return;
        }

        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Failed to load article");
        }

        if (isMounted) {
          setArticle(data.article || null);
        }
      } catch (err) {
        console.error("Failed to load article:", err);

        if (isMounted) {
          setArticle(null);
          setError("load-error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadArticle();

    return () => {
      isMounted = false;
    };
  }, [slug, language]);

  useEffect(() => {
    let isMounted = true;

    async function loadSidebarArticles() {
      try {
        setSidebarLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/articles?lang=${encodeURIComponent(language)}`
        );
        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Failed to load latest articles");
        }

        const allArticles = data.articles || [];
        const filtered = allArticles.filter((item) => item.slug !== slug);

        if (isMounted) {
          setLatestArticles(filtered.slice(0, 8));
          setMoreArticles(filtered.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to load sidebar articles:", err);

        if (isMounted) {
          setLatestArticles([]);
          setMoreArticles([]);
        }
      } finally {
        if (isMounted) {
          setSidebarLoading(false);
        }
      }
    }

    loadSidebarArticles();

    return () => {
      isMounted = false;
    };
  }, [slug, language]);

  useEffect(() => {
    if (!article?.id) return;

    const savedReaction = localStorage.getItem(`reaction_article_${article.id}`);
    if (savedReaction) {
      setSelectedReaction(savedReaction);
    } else {
      setSelectedReaction(null);
    }
  }, [article?.id]);

  const localizedCategory = getCategoryName(article?.category, language);
  const localizedTitle = article?.translation?.title || "";
  const localizedDate = formatArticleDate(article?.publishedAt, language);
  const localizedExcerpt = article?.translation?.excerpt || "";
  const localizedSeoTitle = article?.translation?.seoTitle?.trim() || "";
  const localizedSeoDescription =
    article?.translation?.seoDescription?.trim() || "";

  const localizedContent = useMemo(() => {
    return splitContentToParagraphs(article?.translation?.content);
  }, [article?.translation?.content]);

  const categorySlug = article?.category?.slug || "uzbekistan";
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = localizedSeoTitle || localizedTitle;

  const shareLinks = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent(shareTitle)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`,
    threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(
      `${shareTitle} ${shareUrl}`
    )}`,
  };

  const descriptionFromContent =
    localizedExcerpt ||
    localizedContent.find(
      (paragraph) => typeof paragraph === "string" && paragraph.trim().length > 0
    ) ||
    t.fallbackDescription;

  const seoDescriptionSource =
    localizedSeoDescription || descriptionFromContent || t.fallbackDescription;

  const seoDescription =
    seoDescriptionSource.length > 160
      ? `${seoDescriptionSource.slice(0, 157)}...`
      : seoDescriptionSource;

  const seoTitle = localizedSeoTitle || localizedTitle || t.notFoundTitle;
  const canonical = `/${language}/news/${slug}`;

  const publishedDateIso = article?.publishedAt || null;
  const modifiedDateIso = article?.updatedAt || publishedDateIso || null;

  const schema = article
    ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: seoTitle,
        description: seoDescription,
        image: article.coverImage
          ? [
              article.coverImage.startsWith("http")
                ? article.coverImage
                : `https://digestnews.uz${article.coverImage}`,
            ]
          : [],
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
      }
    : null;

  const reactions = {
    fire: article?.reactions?.fireCount ?? 0,
    heart: article?.reactions?.heartCount ?? 0,
    laugh: article?.reactions?.laughCount ?? 0,
    wow: article?.reactions?.wowCount ?? 0,
    angry: article?.reactions?.angryCount ?? 0,
  };

  const handleReactionClick = async (type) => {
    if (!article?.id || reactionLoading) return;

    if (selectedReaction) {
      alert(t.alreadyReacted);
      return;
    }

    try {
      setReactionLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/articles/${article.id}/react`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to update reaction");
      }

      setArticle((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          reactions: data.reactions,
        };
      });

      setSelectedReaction(type);
      localStorage.setItem(`reaction_article_${article.id}`, type);
    } catch (err) {
      console.error("Failed to update reaction:", err);
    } finally {
      setReactionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="main container">
        <Loader />
      </main>
    );
  }

  if (error === "not-found" || !article) {
    return (
      <main className="main container">
        <Seo
          title={t.notFoundTitle}
          description={t.notFoundText}
          canonical={`/${language}/news/${slug}`}
          type="article"
          locale={locale}
        />

        <section className="article-page">
          <h1>{t.notFoundTitle}</h1>
          <p>{t.notFoundText}</p>
          <Link to={`/${language}`}>{t.backHome}</Link>
        </section>
      </main>
    );
  }

  if (error === "load-error") {
    return (
      <main className="main container">
        <Seo
          title={t.notFoundTitle}
          description={t.loadError}
          canonical={`/${language}/news/${slug}`}
          type="article"
          locale={locale}
        />

        <section className="article-page">
          <h1>{t.notFoundTitle}</h1>
          <p>{t.loadError}</p>
          <Link to={`/${language}`}>{t.backHome}</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="main container">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        image={article.coverImage || ""}
        type="article"
        schema={schema}
        locale={locale}
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

            {article.coverImage && (
              <img src={article.coverImage} alt={seoTitle || localizedTitle} />
            )}

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
                    className={`reaction-btn ${
                      selectedReaction === "fire" ? "active" : ""
                    }`}
                    onClick={() => handleReactionClick("fire")}
                    disabled={reactionLoading || !!selectedReaction}
                  >
                    <span className="reaction-emoji">🔥</span>
                    <span className="reaction-count">{reactions.fire}</span>
                  </button>

                  <button
                    type="button"
                    className={`reaction-btn ${
                      selectedReaction === "heart" ? "active" : ""
                    }`}
                    onClick={() => handleReactionClick("heart")}
                    disabled={reactionLoading || !!selectedReaction}
                  >
                    <span className="reaction-emoji">❤️</span>
                    <span className="reaction-count">{reactions.heart}</span>
                  </button>

                  <button
                    type="button"
                    className={`reaction-btn ${
                      selectedReaction === "laugh" ? "active" : ""
                    }`}
                    onClick={() => handleReactionClick("laugh")}
                    disabled={reactionLoading || !!selectedReaction}
                  >
                    <span className="reaction-emoji">😂</span>
                    <span className="reaction-count">{reactions.laugh}</span>
                  </button>

                  <button
                    type="button"
                    className={`reaction-btn ${
                      selectedReaction === "wow" ? "active" : ""
                    }`}
                    onClick={() => handleReactionClick("wow")}
                    disabled={reactionLoading || !!selectedReaction}
                  >
                    <span className="reaction-emoji">😮</span>
                    <span className="reaction-count">{reactions.wow}</span>
                  </button>

                  <button
                    type="button"
                    className={`reaction-btn ${
                      selectedReaction === "angry" ? "active" : ""
                    }`}
                    onClick={() => handleReactionClick("angry")}
                    disabled={reactionLoading || !!selectedReaction}
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
              {sidebarLoading ? (
                <ul>
                  <li>{t.latest}</li>
                </ul>
              ) : latestArticles.length > 0 ? (
                <ul>
                  {latestArticles.map((item) => (
                    <li key={item.id}>
                      <Link to={`/${language}/news/${item.slug}`}>
                        {item.translation?.title || item.slug}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul>
                  <li>{t.latestError}</li>
                </ul>
              )}
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
          {moreArticles.map((item) => {
            const title = item.translation?.title || "";
            const text = item.translation?.excerpt || "";
            const seoAlt = item.translation?.seoTitle?.trim() || title;

            return (
              <article className="more-news-card" key={item.id}>
                <Link
                  to={`/${language}/news/${item.slug}`}
                  className="more-news-card-link"
                  title={seoAlt}
                >
                  {item.coverImage && <img src={item.coverImage} alt={seoAlt} />}
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