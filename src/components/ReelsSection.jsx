import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/useLanguage'

const reels = [
  {
    image: '/Reels/Darhan.webp',
    video: 'https://www.instagram.com/p/DV8gBEZAux0/embed',
  },
  {
    image: '/Reels/Gaz.webp',
    video: 'https://www.instagram.com/p/DV8XmoIgmVh/embed',
  },
  {
    image: '/Reels/Most.webp',
    video: 'https://www.instagram.com/p/DV8BO1wAu41/embed',
  },
  {
    image: '/Reels/Pagani.webp',
    video: 'https://www.instagram.com/p/DV76ofGg3ut/embed',
  },
]

function ReelsSection({ onOpenReel }) {
  const { language } = useLanguage()

  const viewportRef = useRef(null)
  const trackRef = useRef(null)

  const [index, setIndex] = useState(0)
  const [step, setStep] = useState(0)
  const [visibleCount, setVisibleCount] = useState(1)

  const uiText = {
    ru: {
      title: 'Видео',
      prev: 'Предыдущее видео',
      next: 'Следующее видео',
      instagram: 'Instagram',
      allVideos: 'Смотреть все видео →',
    },
    uz: {
      title: 'Video',
      prev: 'Oldingi video',
      next: 'Keyingi video',
      instagram: 'Instagram',
      allVideos: 'Barcha videolarni ko‘rish →',
    },
  }

  const t = uiText[language] || uiText.ru

  const totalItems = reels.length + 1
  const maxIndex = Math.max(0, totalItems - visibleCount)

  useEffect(() => {
    const updateMetrics = () => {
      if (!viewportRef.current || !trackRef.current) return

      const firstItem = trackRef.current.querySelector(
        '.reels-list-item, .reels-list-item-more'
      )

      if (!firstItem) return

      const itemWidth = firstItem.getBoundingClientRect().width
      const trackStyle = window.getComputedStyle(trackRef.current)
      const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0
      const fullStep = itemWidth + gap

      const viewportWidth = viewportRef.current.getBoundingClientRect().width

      let nextVisibleCount = Math.floor((viewportWidth + gap) / fullStep)
      if (!Number.isFinite(nextVisibleCount) || nextVisibleCount < 1) {
        nextVisibleCount = 1
      }

      const nextMaxIndex = Math.max(0, totalItems - nextVisibleCount)

      setStep(fullStep)
      setVisibleCount(nextVisibleCount)
      setIndex((prev) => Math.min(prev, nextMaxIndex))
    }

    updateMetrics()
    window.addEventListener('resize', updateMetrics)

    return () => {
      window.removeEventListener('resize', updateMetrics)
    }
  }, [totalItems])

  const next = () => {
    setIndex((prev) => Math.min(prev + 1, maxIndex))
  }

  const prev = () => {
    setIndex((prev) => Math.max(prev - 1, 0))
  }

  return (
    <section className="reels-section">
      <div className="reels-header">
        <h2>{t.title}</h2>

        <div className="reels-controls">
          <button
            className="reels-btn"
            type="button"
            onClick={prev}
            disabled={index === 0}
            aria-label={t.prev}
          >
            &#10094;
          </button>

          <button
            className="reels-btn"
            type="button"
            onClick={next}
            disabled={index >= maxIndex}
            aria-label={t.next}
          >
            &#10095;
          </button>
        </div>
      </div>

      <div className="reels-viewport" ref={viewportRef}>
        <ul
          className="reels-track"
          ref={trackRef}
          style={{
            transform: `translateX(-${index * step}px)`,
          }}
        >
          {reels.map((reel, i) => (
            <li className="reels-list-item" key={i}>
              <div className="reels-card">
                <button
                  className="reels-card-preview"
                  type="button"
                  onClick={() => onOpenReel(reel.video)}
                >
                  <span className="reels-card-image">
                    <img
                      src={reel.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width="360"
                      height="640"
                    />
                  </span>

                  <span className="reels-card-play">▶</span>
                </button>

                <a
                  className="reels-card-link"
                  href="https://www.instagram.com/digest.uzbekistan/"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  {t.instagram}
                </a>
              </div>
            </li>
          ))}

          <li className="reels-list-item-more">
            <a
              className="reels-more-card"
              href="https://www.instagram.com/digest.uzbekistan/"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              {t.allVideos}
            </a>
          </li>
        </ul>
      </div>
    </section>
  )
}

export default ReelsSection