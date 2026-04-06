import { useState, useEffect } from 'react'
import TopNews from '../components/TopNews'
import NewsFeed from '../components/NewsFeed'
import ReelsSection from '../components/ReelsSection'
import MoreNews from '../components/MoreNews'
import AdBlock from '../components/AdBlock'
import Loader from '../components/Loader'
import { useLanguage } from '../context/useLanguage'
import Seo from '../components/Seo'

const API_BASE_URL = 'http://localhost:4000'

function HomePage({ onOpenReel }) {
  const { language } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState([])
  const [error, setError] = useState('')

  const seoContent = {
    ru: {
      title: 'Новости Узбекистана и мира',
      description:
        'Свежие новости Узбекистана и мира: политика, экономика, происшествия и технологии.',
    },
    uz: {
      title: 'O‘zbekiston va dunyo yangiliklari',
      description:
        'O‘zbekiston va dunyodagi eng so‘nggi yangiliklar: siyosat, iqtisodiyot va texnologiyalar.',
    },
  }

  const t = seoContent[language] || seoContent.ru

  const locale = language === 'uz' ? 'uz_UZ' : 'ru_RU'
  const canonical = `/${language}`

  useEffect(() => {
    let isMounted = true

    async function loadHomeArticles() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API_BASE_URL}/api/articles?lang=${encodeURIComponent(language)}`
        )
        const data = await response.json()

        if (!response.ok || !data.ok) {
          throw new Error()
        }

        if (isMounted) {
          setArticles(data.articles || [])
        }
      } catch {
        if (isMounted) {
          setArticles([])
          setError('Failed to load articles')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadHomeArticles()

    return () => {
      isMounted = false
    }
  }, [language])

  const featured = articles.filter((article) => article.isFeatured)
  const nonFeatured = articles.filter((article) => !article.isFeatured)

  const uzbekistanNews = nonFeatured.filter(
    (article) => article.category?.slug === 'uzbekistan'
  )

  const featuredArticles =
    featured.length > 0 ? featured.slice(0, 5) : articles.slice(0, 5)

  const latestArticles = articles.slice(0, 8)

  const newsFeedArticles = uzbekistanNews.slice(0, 8)

  const featuredIds = new Set(featuredArticles.map((article) => article.id))
  const uzbekistanIds = new Set(newsFeedArticles.map((article) => article.id))

  const moreNewsArticles = nonFeatured.filter(
    (article) => !featuredIds.has(article.id) && !uzbekistanIds.has(article.id)
  )

  if (loading) {
    return (
      <main className="main container">
        <Loader />
      </main>
    )
  }

  return (
    <main className="main container">
      <Seo
        title={t.title}
        description={t.description}
        canonical={canonical}
        locale={locale}
        image="/preview.jpg"
      />

      <TopNews
        featuredArticles={featuredArticles}
        latestArticles={latestArticles}
        error={error}
      />

      <AdBlock />

      <NewsFeed articles={newsFeedArticles} error={error} />

      <ReelsSection onOpenReel={onOpenReel} />

      <AdBlock />

      <MoreNews articles={moreNewsArticles} error={error} />
    </main>
  )
}

export default HomePage