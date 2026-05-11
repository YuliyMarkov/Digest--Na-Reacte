import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/useLanguage'
import Loader from '../components/Loader'
import Seo from '../components/Seo'
import AdBlock from '../components/AdBlock'
import YandexAdBlock from "../components/YandexAdBlock";

const API_BASE_URL = 'https://digest-news.uz'

function SearchPage() {
  const { language } = useLanguage()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() || ''

  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const uiText = {
    ru: {
      title: 'Поиск',
      resultsTitle: 'Результаты поиска',
      placeholderText: 'Введите запрос в строке поиска',
      noResults: 'По вашему запросу ничего не найдено.',
      error: 'Не удалось выполнить поиск.',
      backHome: 'Вернуться на главную',
    },
    uz: {
      title: 'Qidiruv',
      resultsTitle: 'Qidiruv natijalari',
      placeholderText: 'Qidiruv satriga so‘rov kiriting',
      noResults: 'So‘rovingiz bo‘yicha hech narsa topilmadi.',
      error: 'Qidiruvni bajarib bo‘lmadi.',
      backHome: 'Bosh sahifaga qaytish',
    },
  }

  const t = uiText[language] || uiText.ru
  const locale = language === 'uz' ? 'uz_UZ' : 'ru_RU'

  useEffect(() => {
    let isMounted = true

    async function runSearch() {
      if (!query) {
        setArticles([])
        setError('')
        return
      }

      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API_BASE_URL}/api/articles?lang=${encodeURIComponent(
            language
          )}&search=${encodeURIComponent(query)}`
        )

        const data = await response.json()

        if (!response.ok || !data.ok) {
          throw new Error(data.message || 'Failed to search articles')
        }

        if (isMounted) {
          setArticles(data.articles || [])
        }
      } catch (err) {
        console.error('Failed to search articles:', err)

        if (isMounted) {
          setArticles([])
          setError(t.error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    runSearch()

    return () => {
      isMounted = false
    }
  }, [query, language, t.error])

  const pageTitle = useMemo(() => {
    if (!query) return t.title
    return `${t.resultsTitle}: ${query}`
  }, [query, t.title, t.resultsTitle])

  const pageDescription = useMemo(() => {
    if (!query) {
      return language === 'uz'
        ? 'Sayt bo‘ylab yangiliklarni qidiring.'
        : 'Ищите новости по сайту.'
    }

    return language === 'uz'
      ? `"${query}" bo‘yicha qidiruv natijalari.`
      : `Результаты поиска по запросу «${query}».`
  }, [query, language])

  const canonical = query
    ? `/${language}/search?q=${encodeURIComponent(query)}`
    : `/${language}/search`

  if (loading) {
    return (
      <main className="main container">
        <Seo
          title={pageTitle}
          description={pageDescription}
          canonical={canonical}
          locale={locale}
        />
        <Loader />
      </main>
    )
  }

  return (
    <main className="main container">
      <Seo
        title={pageTitle}
        description={pageDescription}
        canonical={canonical}
        locale={locale}
      />

      <section className="category-news-section">
        <div className="category-header">
          <h1>
            {query ? `${t.resultsTitle}: ${query}` : t.resultsTitle}
          </h1>
        </div>

        <YandexAdBlock />

        {!query ? (
          <div className="category-empty-state">
            <p>{t.placeholderText}</p>
            <Link to={`/${language}`} className="news-more">
              {t.backHome} <span className="arrow">→</span>
            </Link>
          </div>
        ) : error ? (
          <div className="category-empty-state">
            <p>{error}</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="category-empty-state">
            <p>{t.noResults}</p>
          </div>
        ) : (
          <div className="category-news-grid">
            {articles.map((article) => {
              const title = article.translation?.title || article.slug
              const seoTitle = article.translation?.seoTitle?.trim() || ''
              const imageAlt = seoTitle || title
              const text = article.translation?.excerpt || ''

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
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default SearchPage