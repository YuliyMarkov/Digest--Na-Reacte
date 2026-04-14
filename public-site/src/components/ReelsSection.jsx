import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/useLanguage";

const API_BASE_URL = "https://digest-news.uz";

function ReelsSection({ onOpenReel }) {
  const { language } = useLanguage();

  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);

  const uiText = {
    ru: {
      title: "Видео",
      prev: "Предыдущее видео",
      next: "Следующее видео",
      instagram: "Instagram",
      allVideos: "Смотреть все видео →",
      empty: "Видео пока нет",
    },
    uz: {
      title: "Video",
      prev: "Oldingi video",
      next: "Keyingi video",
      instagram: "Instagram",
      allVideos: "Barcha videolarni ko‘rish →",
      empty: "Videolar hozircha yo‘q",
    },
  };

  const t = uiText[language] || uiText.ru;
  const totalItems = reels.length > 0 ? reels.length + 1 : 0;
  const maxIndex = Math.max(0, totalItems - visibleCount);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReels() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/media?type=reel&visibleOnly=true`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Failed to load reels");
        }

        const normalizedReels = (data.mediaItems || []).map((item) => ({
          id: item.id,
          image: item.previewImage || "",
          video: item.videoUrl || "",
          title:
            language === "uz"
              ? item.titleUz || item.titleRu || ""
              : item.titleRu || item.titleUz || "",
        }));

        setReels(normalizedReels);
      } catch (err) {
        if (err.name === "AbortError") return;

        setReels([]);
        setError("Failed to load reels");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReels();

    return () => {
      controller.abort();
    };
  }, [language]);

  useEffect(() => {
    const updateMetrics = () => {
      if (!viewportRef.current || !trackRef.current) return;

      const firstItem = trackRef.current.querySelector(
        ".reels-list-item, .reels-list-item-more"
      );

      if (!firstItem) return;

      const itemWidth = firstItem.getBoundingClientRect().width;
      const trackStyle = window.getComputedStyle(trackRef.current);
      const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || "0") || 0;
      const fullStep = itemWidth + gap;
      const viewportWidth = viewportRef.current.getBoundingClientRect().width;

      let nextVisibleCount = Math.floor((viewportWidth + gap) / fullStep);

      if (!Number.isFinite(nextVisibleCount) || nextVisibleCount < 1) {
        nextVisibleCount = 1;
      }

      const nextMaxIndex = Math.max(0, totalItems - nextVisibleCount);

      setStep(fullStep);
      setVisibleCount(nextVisibleCount);
      setIndex((prev) => Math.min(prev, nextMaxIndex));
    };

    updateMetrics();
    window.addEventListener("resize", updateMetrics);

    return () => {
      window.removeEventListener("resize", updateMetrics);
    };
  }, [totalItems]);

  useEffect(() => {
    setIndex(0);
  }, [reels.length]);

  const next = () => {
    setIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prev = () => {
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <section className="reels-section">
        <div className="reels-header">
          <h2>{t.title}</h2>
        </div>

        <div className="more-news-empty">
          <p>{t.title}...</p>
        </div>
      </section>
    );
  }

  if (error || reels.length === 0) {
    return (
      <section className="reels-section">
        <div className="reels-header">
          <h2>{t.title}</h2>
        </div>

        <div className="more-news-empty">
          <p>{t.empty}</p>
        </div>
      </section>
    );
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
          {reels.map((reel) => (
            <li className="reels-list-item" key={reel.id}>
              <div className="reels-card">
                <button
                  className="reels-card-preview"
                  type="button"
                  onClick={() => onOpenReel(reel.video)}
                  title={reel.title || t.instagram}
                >
                  <span className="reels-card-image">
                    {reel.image && (
                      <img
                        src={reel.image}
                        alt={reel.title || t.instagram}
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        width="360"
                        height="640"
                      />
                    )}
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
  );
}

export default ReelsSection;