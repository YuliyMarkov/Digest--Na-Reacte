import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/useLanguage'

function TopNews({ articles = [] }) {
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
      empty: 'Пока нет новостей',
    },
    uz: {
      main: 'Asosiy',
      latest: 'So‘nggi yangiliklar',
      prev: 'Oldingi yangilik',
      next: 'Keyingi yangilik',
      slide: 'Slaydga o‘tish',
      empty: 'Hozircha yangiliklar yo‘q',
    },
  }

  const t = uiText[language] || uiText.ru

  const slides = articles.slice(0, 5)
  const latestArticles = articles.slice(0, 8)

  const safeCurrentSlide =
    slides.length === 0 ? 0 : Math.min(currentSlide, slides.length - 1)

  useEffect(() => {
    const firstSlideImage = slides[0]?.coverImage
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
      if (document.head.contains(preloadLink)) {
        document.head.removeChild(preloadLink)
      }
    }
  }, [slides])

  const goToPrev = () => {
    if (slides.length === 0) return
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const goToNext = () => {
    if (slides.length === 0) return
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  useEffect(() => {
    if (isPaused || slides.length <= 1) return

    const intervalId = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
    }, 3000)

    return () => clearInterval(intervalId)
  }, [isPaused, slides.length])

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

          {slides.length === 0 ? (
            <div className="top-news-empty">
              <p>{t.empty}</p>
            </div>
          ) : (
            <>
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
                    style={{ transform: `translateX(-${safeCurrentSlide * 100}%)` }}
                  >
                    {slides.map((slide, index) => {
                      const title = slide.translation?.title || slide.slug
                      const alt = title

                      return (
                        <article className="top-slide" key={slide.id}>
                          <Link
                            to={`/${language}/news/${slide.slug}`}
                            className="top-slide-link"
                          >
                            {slide.coverImage && (
                              <img
                                src={slide.coverImage}
                                alt={alt}
                                loading={index === 0 ? 'eager' : 'lazy'}
                                fetchpriority={index === 0 ? 'high' : 'auto'}
                                decoding="async"
                                width="1200"
                                height="675"
                              />
                            )}
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
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    className={`top-news-dot ${safeCurrentSlide === index ? 'active' : ''}`}
                    type="button"
                    aria-label={`${t.slide} ${index + 1}`}
                    onClick={() => goToSlide(index)}
                  ></button>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="top-news-sidebar">
          <h3>{t.latest}</h3>

          <div className="latest-news-box">
            <ul>
              {latestArticles.length > 0 ? (
                latestArticles.map((item) => (
                  <li key={item.id}>
                    <Link to={`/${language}/news/${item.slug}`}>
                      {item.translation?.title || item.slug}
                    </Link>
                  </li>
                ))
              ) : (
                <li>{t.empty}</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default TopNews