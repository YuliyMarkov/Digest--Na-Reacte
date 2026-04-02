import { useState } from 'react'
import { Link } from 'react-router-dom'
import { moreNewsInitial, moreNewsExtra } from '../data/homePageData'
import { useLanguage } from '../context/useLanguage'
import { getLocalizedValue } from '../utils/getLocalizedValue'

const batchSize = 4

function MoreNews() {
  const { language } = useLanguage()

  const [visibleNews, setVisibleNews] = useState(moreNewsInitial)
  const [loadedCount, setLoadedCount] = useState(0)

  const uiText = {
    ru: {
      allNews: 'Все новости',
      loadMore: 'Больше новостей',
    },
    uz: {
      allNews: 'Barcha yangiliklar',
      loadMore: 'Ko‘proq yangilik',
    },
  }

  const t = uiText[language] || uiText.ru

  const handleLoadMore = () => {
    const nextItems = moreNewsExtra.slice(loadedCount, loadedCount + batchSize)
    setVisibleNews((prev) => [...prev, ...nextItems])
    setLoadedCount((prev) => prev + nextItems.length)
  }

  const hasMore = loadedCount < moreNewsExtra.length

  return (
    <section className="more-news-section">
      <div className="more-news-header">
        <h2>{t.allNews}</h2>
      </div>

      <div className="more-news-grid">
        {visibleNews.map((item, index) => {
          const title = getLocalizedValue(item.title, language)
          const text = getLocalizedValue(item.text, language)

          return (
            <article className="more-news-card" key={index}>
              <Link
                to={`/${language}/news/${item.slug}`}
                className="more-news-card-link"
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
          )
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
  )
}

export default MoreNews