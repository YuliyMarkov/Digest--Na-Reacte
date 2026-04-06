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
        'Свежие новости Узбекистана и мира: политика, происшествия, экономика, технологии. Читайте быстро и по делу.',
    },
    uz: {
      title: 'O‘zbekiston va dunyo yangiliklari',
      description:
        'O‘zbekiston va dunyodagi so‘nggi yangiliklar: siyosat, hodisalar, iqtisodiyot va texnologiyalar.',
    },
  }

  const t = seoContent[language] || seoContent.ru
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
          throw new Error(data.message || 'Failed to load articles')
        }

        if (isMounted) {
          setArticles(data.articles || [])
        }
      } catch (err) {
        console.error('Failed to load home articles:', err)

        if (isMounted) {
          setArticles([])
          setError('Failed to load articles')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadHomeArticles()

    return () => {
      isMounted = false
    }
  }, [language])

  const featuredArticles = articles.filter((article) => article.isFeatured)
  const nonFeaturedArticles = articles.filter((article) => !article.isFeatured)

  const topNewsArticles =
    featuredArticles.length > 0 ? featuredArticles.slice(0, 5) : articles.slice(0, 5)

  const newsFeedArticles = nonFeaturedArticles.slice(0, 8)
  const moreNewsArticles = nonFeaturedArticles.slice(8)

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
      />

      <TopNews articles={topNewsArticles} />

      <AdBlock />

      <NewsFeed articles={newsFeedArticles} error={error} />

      <ReelsSection onOpenReel={onOpenReel} />

      <AdBlock />

      <MoreNews articles={moreNewsArticles} error={error} />
    </main>
  )
}

export default HomePage