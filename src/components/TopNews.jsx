import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { topSlides, latestNews } from '../data/homePageData'
import { useLanguage } from '../context/useLanguage'
import { getLocalizedValue } from '../utils/getLocalizedValue'

function TopNews() {
  const { language } = useLanguage()

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const uiText = {
    ru: {
      main: 'Главное',
      latest: 'Последние новости',
      prev: 'Предыдущая новость',
      next: 'Следующая новость',
      slide: 'Перейти к слайду',
    },
    uz: {
      main: 'Asosiy',
      latest: 'So‘nggi yangiliklar',
      prev: 'Oldingi yangilik',
      next: 'Keyingi yangilik',
      slide: 'Slaydga o‘tish',
    },
  }

  const t = uiText[language] || uiText.ru

  useEffect(() => {
  const firstSlideImage = topSlides[0]?.image
  if (!firstSlideImage) return

  const existingPreload = document.querySelector(
    `link[rel="preload"][href="${firstSlideImage}"]`
  )

  if (existingPreload) return

  const preloadLink = document.createElement('link')
  preloadLink.rel = 'preload'
  preloadLink.as = 'image'
  preloadLink.href = firstSlideImage

  document.head.appendChild(preloadLink)

  return () => {
    document.head.removeChild(preloadLink)
  }
}, [])

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? topSlides.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev === topSlides.length - 1 ? 0 : prev + 1))
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

useEffect(() => {
  if (isPaused) return

  const startDelay = setTimeout(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === topSlides.length - 1 ? 0 : prev + 1
      )
    }, 3000)

    return () => clearInterval(interval)
  }, 3000) // ← даём странице прогрузиться

  return () => clearTimeout(startDelay)
}, [isPaused])

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].clientX
  }

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX

    const diff = touchStartX.current - touchEndX.current
    const swipeThreshold = 50

    if (Math.abs(diff) < swipeThreshold) return

    if (diff > 0) {
      goToNext()
    } else {
      goToPrev()
    }
  }

  return (
    <section className="top-news">
      <div className="top-news-layout">
        <div className="top-news-left">
          <div className="top-news-header">
            <h2>{t.main}</h2>
          </div>

          <div
            className="top-news-slider"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              className="slider-btn prev"
              type="button"
              aria-label={t.prev}
              onClick={goToPrev}
            >
              &#10094;
            </button>

            <div className="top-news-viewport">
              <div
                className="top-news-track"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {topSlides.map((slide, index) => {
                  const title = getLocalizedValue(slide.title, language)
                  const alt = getLocalizedValue(slide.alt, language)

                  return (
                    <article className="top-slide" key={index}>
                      <Link
                        to={`/${language}/news/${slide.slug}`}
                        className="top-slide-link"
                      >
                        <img
                          src={slide.image}
                          alt={alt || title}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          fetchpriority={index === 0 ? 'high' : 'auto'}
                          decoding="async"
                          width="1200"
                          height="675"
                        />
                        <div className="top-slide-overlay">
                          <h3>{title}</h3>
                        </div>
                      </Link>
                    </article>
                  )
                })}
              </div>
            </div>

            <button
              className="slider-btn next"
              type="button"
              aria-label={t.next}
              onClick={goToNext}
            >
              &#10095;
            </button>
          </div>

          <div className="top-news-dots">
            {topSlides.map((_, index) => (
              <button
                key={index}
                className={`top-news-dot ${currentSlide === index ? 'active' : ''}`}
                type="button"
                aria-label={`${t.slide} ${index + 1}`}
                onClick={() => goToSlide(index)}
              ></button>
            ))}
          </div>
        </div>

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
  )
}

export default TopNews