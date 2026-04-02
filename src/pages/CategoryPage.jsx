import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  featuredNews,
  moreNewsInitial,
  moreNewsExtra,
} from "../data/homePageData";
import { useLanguage } from "../context/useLanguage";
import { getLocalizedValue } from "../utils/getLocalizedValue";
import AdBlock from "../components/AdBlock";
import Loader from "../components/Loader";
import Seo from "../components/Seo";

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

  const [loadedCount, setLoadedCount] = useState(0);

  const initialCategoryNews = [...featuredNews, ...moreNewsInitial].slice(0, 8);
  const categoryLoadMorePool = [...moreNewsExtra, ...moreNewsInitial];

  const visibleNews = [
    ...initialCategoryNews,
    ...categoryLoadMorePool.slice(0, loadedCount),
  ];

  const handleLoadMore = () => {
    setLoadedCount((prev) =>
      Math.min(prev + batchSize, categoryLoadMorePool.length)
    );
  };

  const hasMore = loadedCount < categoryLoadMorePool.length;

  return (
    <main className="main container">
      <Seo
        title={pageTitle}
        description={seoDescription}
        canonical={canonical}
        type="website"
      />

      <section className="category-news-section">
        <div className="category-header">
          <h1>{pageTitle}</h1>
        </div>

        <AdBlock />

        <div className="category-news-grid">
          {visibleNews.map((item, index) => {
            const title = getLocalizedValue(item.title, language);
            const text = getLocalizedValue(item.text, language);

            return (
              <article
                className="category-news-card"
                key={`${item.slug}-${index}`}
              >
                <Link
                  to={`/${language}/news/${item.slug}`}
                  className="category-news-card-link"
                >
                  <img src={item.image} alt={title} />
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

export default CategoryPage;