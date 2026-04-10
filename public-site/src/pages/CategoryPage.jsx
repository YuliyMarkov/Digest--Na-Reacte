import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../context/useLanguage";
import AdBlock from "../components/AdBlock";
import Loader from "../components/Loader";
import Seo from "../components/Seo";

const API_BASE_URL = "http://localhost:4000";
const batchSize = 8;

function CategoryPage() {
  const { slug } = useParams();
  const { language } = useLanguage();

  const titles = {
    ru: {
      uzbekistan: "Узбекистан",
      world: "Мир",
      auto: "Авто",
      incidents: "Происшествия",
      science: "Наука",
      economy: "Экономика",
      default: "Категория",
      allNews: "Все новости",
      showMore: "Смотреть ещё",
      loadMore: "Больше новостей",
      error: "Не удалось загрузить новости.",
      empty: "В этой категории пока нет новостей.",
    },
    uz: {
      uzbekistan: "O‘zbekiston",
      world: "Dunyo",
      auto: "Avto",
      incidents: "Hodisalar",
      science: "Fan",
      economy: "Iqtisod",
      default: "Kategoriya",
      allNews: "Barcha yangiliklar",
      showMore: "Yana ko‘rish",
      loadMore: "Ko‘proq yangilik",
      error: "Yangiliklarni yuklab bo‘lmadi.",
      empty: "Bu kategoriyada hozircha yangiliklar yo‘q.",
    },
  };

  const seoDescriptions = {
    ru: {
      uzbekistan:
        "Свежие новости Узбекистана: главные события, происшествия, экономика и важные обновления дня.",
      world:
        "Последние новости мира: главные международные события, политика, экономика и происшествия.",
      auto:
        "Авто новости: новые модели, изменения на рынке, обзоры и главные события автомобильной сферы.",
      incidents:
        "Происшествия: ДТП, чрезвычайные ситуации, криминальные сводки и важные события.",
      science:
        "Новости науки: технологии, открытия, исследования и главные научные события.",
      economy:
        "Новости экономики: финансы, бизнес, рынок и экономические изменения в Узбекистане и мире.",
      default:
        "Свежие новости, главные события и актуальные материалы на сайте «Дайджест».",
    },
    uz: {
      uzbekistan:
        "O‘zbekiston yangiliklari: kunning muhim voqealari, hodisalar, iqtisodiyot va dolzarb yangilanishlar.",
      world:
        "Dunyo yangiliklari: xalqaro voqealar, siyosat, iqtisodiyot va muhim hodisalar.",
      auto:
        "Avto yangiliklar: yangi modelllar, bozor o‘zgarishlari, sharhlar va avtomobil sohasidagi voqealar.",
      incidents:
        "Hodisalar: YTH, favqulodda holatlar, jinoyat xabarlari va muhim voqealar.",
      science:
        "Fan yangiliklari: texnologiyalar, kashfiyotlar, tadqiqotlar va ilmiy voqealar.",
      economy:
        "Iqtisodiyot yangiliklari: moliya, biznes, bozor va iqtisodiy o‘zgarishlar.",
      default:
        "«Dayjest» saytida so‘nggi yangiliklar, muhim voqealar va dolzarb materiallar.",
    },
  };

  const t = titles[language] || titles.ru;
  const pageTitle = t[slug] || t.default;
  const seoDescription =
    seoDescriptions[language]?.[slug] || seoDescriptions[language]?.default;
  const canonical = `/${language}/category/${slug}`;
  const locale = language === "uz" ? "uz_UZ" : "ru_RU";

  const [articles, setArticles] = useState([]);
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadArticles() {
      try {
        setLoading(true);
        setError("");
        setVisibleCount(batchSize);

        const response = await fetch(
          `${API_BASE_URL}/api/articles?category=${encodeURIComponent(
            slug
          )}&lang=${encodeURIComponent(language)}`
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Failed to load articles");
        }

        if (isMounted) {
          setArticles(data.articles || []);
        }
      } catch (err) {
        console.error("Failed to load category articles:", err);

        if (isMounted) {
          setArticles([]);
          setError(t.error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadArticles();

    return () => {
      isMounted = false;
    };
  }, [slug, language, t.error]);

  const visibleArticles = useMemo(() => {
    return articles.slice(0, visibleCount);
  }, [articles, visibleCount]);

  const hasMore = visibleCount < articles.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + batchSize, articles.length));
  };

  if (loading) {
    return (
      <main className="main container">
        <Seo
          title={pageTitle}
          description={seoDescription}
          canonical={canonical}
          type="website"
          locale={locale}
        />
        <Loader />
      </main>
    );
  }

  return (
    <main className="main container">
      <Seo
        title={pageTitle}
        description={seoDescription}
        canonical={canonical}
        type="website"
        locale={locale}
      />

      <section className="category-news-section">
        <div className="category-header">
          <h1>{pageTitle}</h1>
        </div>

        <AdBlock />

        {error ? (
          <div className="category-empty-state">
            <p>{error}</p>
          </div>
        ) : visibleArticles.length === 0 ? (
          <div className="category-empty-state">
            <p>{t.empty}</p>
          </div>
        ) : (
          <>
            <div className="category-news-grid">
              {visibleArticles.map((article) => {
                const title = article.translation?.title || article.slug;
                const seoTitle = article.translation?.seoTitle?.trim() || "";
                const imageAlt = seoTitle || title;
                const text = article.translation?.excerpt || "";

                return (
                  <article className="category-news-card" key={article.id}>
                    <Link
                      to={`/${language}/news/${article.slug}`}
                      className="category-news-card-link"
                      title={imageAlt}
                    >
                      {article.coverImage && (
                        <img
                          src={article.coverImage}
                          alt={imageAlt}
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

      <AdBlock />
    </main>
  );
}

export default CategoryPage;