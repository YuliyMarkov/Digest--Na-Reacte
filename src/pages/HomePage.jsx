import { useState, useEffect } from 'react'
import TopNews from '../components/TopNews'
import NewsFeed from '../components/NewsFeed'
import ReelsSection from '../components/ReelsSection'
import MoreNews from '../components/MoreNews'
import AdBlock from '../components/AdBlock'
import Loader from '../components/Loader'
import { useLanguage } from '../context/useLanguage'
import Seo from '../components/Seo'

function HomePage({ onOpenReel }) {
  const { language } = useLanguage()

  const [loading, setLoading] = useState(false)

  const seoContent = {
    ru: {
      title: "Новости Узбекистана и мира",
      description:
        "Свежие новости Узбекистана и мира: политика, происшествия, экономика, технологии. Читайте быстро и по делу.",
    },
    uz: {
      title: "O‘zbekiston va dunyo yangiliklari",
      description:
        "O‘zbekiston va dunyodagi so‘nggi yangiliklar: siyosat, hodisalar, iqtisodiyot va texnologiyalar.",
    },
  }

  const t = seoContent[language] || seoContent.ru
  const canonical = `/${language}`

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

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

      <TopNews />

      <AdBlock />

      <NewsFeed />

      <ReelsSection onOpenReel={onOpenReel} />

      <AdBlock />

      <MoreNews />
    </main>
  )
}

export default HomePage