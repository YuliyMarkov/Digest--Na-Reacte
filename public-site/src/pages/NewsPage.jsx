import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../context/useLanguage";
import AdBlock from "../components/AdBlock";
import Loader from "../components/Loader";
import YandexAdBlock from "../components/YandexAdBlock";
import Seo from "../components/Seo";

const API_BASE_URL = "https://digest-news.uz";

function formatArticleDate(dateString, language) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const months = {
    ru: [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ],
    uz: [
      "yanvar",
      "fevral",
      "mart",
      "aprel",
      "may",
      "iyun",
      "iyul",
      "avgust",
      "sentyabr",
      "oktyabr",
      "noyabr",
      "dekabr",
    ],
  };

  const langKey = language === "uz" ? "uz" : "ru";
  const day = date.getDate();
  const month = months[langKey][date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

function getCategoryName(category, language) {
  if (!category) return "";
  return language === "uz" ? category.nameUz : category.nameRu;
}

function stripHtml(html) {
  if (!html || typeof html !== "string") return "";

  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSearchQuery(title) {
  if (!title || typeof title !== "string") return "";

  const stopWordsRu = new Set([
    "и",
    "в",
    "во",
    "на",
    "с",
    "со",
    "по",
    "за",
    "от",
    "до",
    "из",
    "у",
    "о",
    "об",
    "под",
    "при",
    "к",
    "ко",
    "не",
    "но",
    "что",
    "как",
    "это",
    "уже",
    "ещё",
    "еще",
    "для",
    "или",
    "а",
    "то",
    "же",
    "ли",
    "бы",
  ]);

  const stopWordsUz = new Set([
    "va",
    "ham",
    "bilan",
    "uchun",
    "bu",
    "shu",
    "o‘sha",
    "osha",
    "bir",
    "ikki",
    "uch",
    "da",
    "de",
    "dan",
    "ga",
    "ka",
    "ni",
    "mi",
    "yo",
    "yoki",
    "lekin",
    "ammo",
  ]);

  const words = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => word.length > 2)
    .filter((word) => !stopWordsRu.has(word) && !stopWordsUz.has(word));

  return [...new Set(words)].slice(0, 4).join(" ");
}

function mergeUniqueArticles(...groups) {
  const map = new Map();

  groups.flat().forEach((item) => {
    if (!item?.id) return;
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
}

function parseTelegramEmbedUrl(url) {
  if (!url || typeof url !== "string") return null;

  try {
    const normalizedUrl = url.trim();
    if (!normalizedUrl) return null;

    const parsed = new URL(normalizedUrl);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host !== "t.me" && host !== "telegram.me") {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);

    if (parts.length < 2) return null;

    const channel = parts[0];
    const postId = parts[1];

    if (!channel || !postId || !/^\d+$/.test(postId)) {
      return null;
    }

    return {
      channel,
      postId,
    };
  } catch {
    return null;
  }
}

function parseYoutubeEmbedUrl(url) {
  if (!url || typeof url !== "string") return null;

  try {
    const normalizedUrl = url.trim();
    if (!normalizedUrl) return null;

    const parsed = new URL(normalizedUrl);
    const host = parsed.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);

      if (parts[0] === "watch") {
        videoId = parsed.searchParams.get("v") || "";
      } else if (parts[0] === "shorts" && parts[1]) {
        videoId = parts[1];
      } else if (parts[0] === "embed" && parts[1]) {
        videoId = parts[1];
      }
    } else if (host === "youtube-nocookie.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);

      if (parts[0] === "embed" && parts[1]) {
        videoId = parts[1];
      }
    }

    if (!videoId) return null;

    const cleanVideoId = videoId.replace(/[^a-zA-Z0-9_-]/g, "").trim();

    if (!cleanVideoId) return null;

    return `https://www.youtube.com/embed/${cleanVideoId}`;
  } catch {
    return null;
  }
}

function TelegramPostEmbed({ url }) {
  const embedData = useMemo(() => parseTelegramEmbedUrl(url), [url]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!embedData || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute(
      "data-telegram-post",
      `${embedData.channel}/${embedData.postId}`,
    );
    script.setAttribute("data-width", "100%");
    script.setAttribute("data-userpic", "true");

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [embedData]);

  if (!embedData) return null;

  return <div className="article-telegram-embed" ref={containerRef} />;
}

function YoutubeVideoEmbed({ url, title }) {
  const embedUrl = useMemo(() => parseYoutubeEmbedUrl(url), [url]);

  const isShort = useMemo(() => {
    if (!url) return false;
    return url.includes("shorts") || url.includes("youtu.be");
  }, [url]);

  if (!embedUrl) return null;

  return (
    <div className={`article-youtube-embed ${isShort ? "short" : ""}`}>
      <iframe
        src={embedUrl}
        title={title || "YouTube video"}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
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
  const articleLayoutRef = useRef(null);
  const sidebarRef = useRef(null);

  const uiText = {
    ru: {
      notFoundTitle: "Новость не найдена",
      notFoundText: "Такой статьи пока нет или ссылка устарела.",
      backHome: "Вернуться на главную",
      home: "Главная",
      latest: "Последние новости",
      related: "Похожие новости",
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
      related: "O‘xshash yangiliklar",
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
            slug,
          )}?lang=${encodeURIComponent(language)}`,
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
          `${API_BASE_URL}/api/articles?lang=${encodeURIComponent(language)}`,
        );
        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Failed to load latest articles");
        }

        const allArticles = data.articles || [];
        const filtered = allArticles.filter((item) => item.slug !== slug);

        if (isMounted) {
          setLatestArticles(filtered.slice(0, 8));
        }
      } catch (err) {
        console.error("Failed to load sidebar articles:", err);

        if (isMounted) {
          setLatestArticles([]);
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

    let isMounted = true;

    async function loadRelatedArticles() {
      try {
        const currentTitle = article?.translation?.title || "";
        const currentCategorySlug = article?.category?.slug || "";
        const searchQuery = extractSearchQuery(currentTitle);

        let searchResults = [];
        let categoryResults = [];
        let latestResults = [];

        if (searchQuery) {
          const response = await fetch(
            `${API_BASE_URL}/api/articles?lang=${encodeURIComponent(
              language,
            )}&search=${encodeURIComponent(searchQuery)}`,
          );

          const data = await response.json();

          if (response.ok && data.ok) {
            searchResults = data.articles || [];
          }
        }

        if (currentCategorySlug) {
          const response = await fetch(
            `${API_BASE_URL}/api/articles?lang=${encodeURIComponent(
              language,
            )}&category=${encodeURIComponent(currentCategorySlug)}`,
          );

          const data = await response.json();

          if (response.ok && data.ok) {
            categoryResults = data.articles || [];
          }
        }

        if (searchResults.length < 6 || categoryResults.length < 6) {
          const response = await fetch(
            `${API_BASE_URL}/api/articles?lang=${encodeURIComponent(language)}`,
          );

          const data = await response.json();

          if (response.ok && data.ok) {
            latestResults = data.articles || [];
          }
        }

        const filteredSearch = searchResults.filter(
          (item) =>
            item.slug !== slug && item.category?.slug === currentCategorySlug,
        );

        const filteredCategory = categoryResults.filter(
          (item) => item.slug !== slug,
        );

        const filteredLatest = latestResults.filter(
          (item) => item.slug !== slug,
        );

        const merged = mergeUniqueArticles(
          filteredSearch,
          filteredCategory,
          filteredLatest,
        ).slice(0, 6);

        if (isMounted) {
          setMoreArticles(merged);
        }
      } catch (err) {
        console.error("Failed to load related articles:", err);

        if (isMounted) {
          setMoreArticles([]);
        }
      }
    }

    loadRelatedArticles();

    return () => {
      isMounted = false;
    };
  }, [article, slug, language]);

  useEffect(() => {
    if (!article?.id) return;

    const savedReaction = localStorage.getItem(
      `reaction_article_${article.id}`,
    );
    if (savedReaction) {
      setSelectedReaction(savedReaction);
    } else {
      setSelectedReaction(null);
    }
  }, [article?.id]);

  useEffect(() => {
    const layout = articleLayoutRef.current;
    const sidebar = sidebarRef.current;

    if (!layout || !sidebar) return;

    function updateSidebarPosition() {
      if (window.innerWidth <= 1180) {
        sidebar.style.transform = "";
        return;
      }

      const layoutRect = layout.getBoundingClientRect();
      const layoutTop = window.scrollY + layoutRect.top;
      const layoutHeight = layout.offsetHeight;
      const sidebarHeight = sidebar.offsetHeight;
      const offsetTop = 24;

      const maxTranslate = Math.max(0, layoutHeight - sidebarHeight);
      const nextTranslate = Math.min(
        Math.max(0, window.scrollY - layoutTop + offsetTop),
        maxTranslate,
      );

      sidebar.style.transform = `translateY(${nextTranslate}px)`;
    }

    updateSidebarPosition();

    window.addEventListener("scroll", updateSidebarPosition, { passive: true });
    window.addEventListener("resize", updateSidebarPosition);

    return () => {
      window.removeEventListener("scroll", updateSidebarPosition);
      window.removeEventListener("resize", updateSidebarPosition);
    };
  }, [article, latestArticles]);

  const localizedCategory = getCategoryName(article?.category, language);
  const localizedTitle = article?.translation?.title || "";
  const localizedDate = formatArticleDate(article?.publishedAt, language);
  const localizedExcerpt = article?.translation?.excerpt || "";
  const localizedSeoTitle = article?.translation?.seoTitle?.trim() || "";
  const localizedSeoDescription =
    article?.translation?.seoDescription?.trim() || "";
  const localizedContentHtml = article?.translation?.content || "";
  const telegramEmbedUrl = article?.translation?.telegramEmbedUrl || "";
  const youtubeEmbedUrl = article?.translation?.youtubeEmbedUrl || "";

  const plainTextContent = useMemo(() => {
    return stripHtml(localizedContentHtml);
  }, [localizedContentHtml]);

  const categorySlug = article?.category?.slug || "uzbekistan";
  const shareUrl =
    typeof window !== "undefined"
      ? `https://digest-news.uz/${language}/news/${slug}`
      : `https://digest-news.uz/${language}/news/${slug}`;
  const shareTitle = localizedSeoTitle || localizedTitle;

  const shareLinks = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(
      shareUrl,
    )}&text=${encodeURIComponent(shareTitle)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl,
    )}`,
    threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(
      `${shareTitle} ${shareUrl}`,
    )}`,
  };

  const descriptionFromContent =
    localizedExcerpt || plainTextContent || t.fallbackDescription;

  const seoDescriptionSource =
    localizedSeoDescription || descriptionFromContent || t.fallbackDescription;

  const seoDescription =
    seoDescriptionSource.length > 160
      ? `${seoDescriptionSource.slice(0, 157)}...`
      : seoDescriptionSource;

  const seoTitle = localizedSeoTitle || localizedTitle || t.notFoundTitle;
  const canonical = `/${language}/news/${slug}`;
  const alternateRu = `/ru/news/${slug}`;
  const alternateUz = `/uz/news/${slug}`;

  const publishedDateIso = article?.publishedAt || null;
  const modifiedDateIso = article?.updatedAt || publishedDateIso || null;

  const articleImage = article?.coverImage
    ? article.coverImage.startsWith("http")
      ? article.coverImage
      : `https://digest-news.uz${article.coverImage}`
    : "";

  const schemaKeywords = extractSearchQuery(localizedTitle)
    .split(" ")
    .filter(Boolean);

  const schema = article
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "NewsArticle",
            headline: seoTitle,
            description: seoDescription,
            url: "__PAGE_URL__",
            image: articleImage ? [articleImage] : [],
            thumbnailUrl: articleImage || undefined,

            ...(publishedDateIso ? { datePublished: publishedDateIso } : {}),
            ...(modifiedDateIso ? { dateModified: modifiedDateIso } : {}),

            author: {
              "@type": "Organization",
              name: "Дайджест",
            },

            publisher: {
              "@type": "Organization",
              name: "Дайджест",
              logo: {
                "@type": "ImageObject",
                url: "https://digest-news.uz/New_Logo.png",
              },
            },

            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": "__PAGE_URL__",
            },

            isAccessibleForFree: true,
            articleSection: localizedCategory || undefined,
            inLanguage: language === "uz" ? "uz-UZ" : "ru-RU",
            genre: ["News"],
            keywords: schemaKeywords.length > 0 ? schemaKeywords : undefined,
            articleBody: plainTextContent?.slice(0, 5000) || undefined,
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: t.home,
                item: `https://digest-news.uz/${language}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: localizedCategory,
                item: `https://digest-news.uz/${language}/category/${categorySlug}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: localizedTitle,
                item: "__PAGE_URL__",
              },
            ],
          },
        ],
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
        },
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
          alternateRu={`/ru/news/${slug}`}
          alternateUz={`/uz/news/${slug}`}
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
          alternateRu={`/ru/news/${slug}`}
          alternateUz={`/uz/news/${slug}`}
          type="article"
          locale={locale}
          publishedTime={publishedDateIso || ""}
          modifiedTime={modifiedDateIso || ""}
          section={localizedCategory || ""}
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
      <YandexAdBlock />
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        alternateRu={alternateRu}
        alternateUz={alternateUz}
        image={article.coverImage || ""}
        type="article"
        schema={schema}
        locale={locale}
        preloadImage={article.coverImage || ""}
        publishedTime={publishedDateIso || ""}
        modifiedTime={modifiedDateIso || ""}
        section={localizedCategory || ""}
      />

      <section className="article-page">
        <div className="breadcrumbs">
          <Link to={`/${language}`}>{t.home}</Link> /{" "}
          <Link to={`/${language}/category/${categorySlug}`}>
            {localizedCategory}
          </Link>{" "}
          / <span>{localizedTitle}</span>
        </div>

        <div className="article-layout" ref={articleLayoutRef}>
          <article className="article-main">
            <div className="article-meta">
              <span className="article-category">{localizedCategory}</span>
              <span className="article-date">{localizedDate}</span>
              <span className="article-author">
                {language === "uz"
                  ? "Dayjest tahririyati"
                  : "Редакция «Дайджест»"}
              </span>
            </div>

            <h1>{localizedTitle}</h1>

            {article.coverImage && (
              <img
                src={article.coverImage}
                alt={seoTitle || localizedTitle}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width="1200"
                height="630"
              />
            )}

            <div
              className="article-content rich-text-content"
              dangerouslySetInnerHTML={{ __html: localizedContentHtml }}
            />

            {telegramEmbedUrl && <TelegramPostEmbed url={telegramEmbedUrl} />}

            {youtubeEmbedUrl && (
              <YoutubeVideoEmbed url={youtubeEmbedUrl} title={localizedTitle} />
            )}

            <YandexAdBlock />

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
                  <img
                    src="/Icons/TG-icon.svg"
                    alt="Telegram"
                    loading="lazy"
                    decoding="async"
                  />
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

          <aside className="top-news-sidebar" ref={sidebarRef}>
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

      <YandexAdBlock />

      <section className="more-news-section">
        <div className="news-feed-header">
          <h2>{t.related}</h2>

          <Link
            to={`/${language}/category/${categorySlug}`}
            className="news-more"
          >
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
                  {item.coverImage && (
                    <img
                      src={item.coverImage}
                      alt={seoAlt}
                      loading="lazy"
                      decoding="async"
                      width="600"
                      height="400"
                    />
                  )}
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
