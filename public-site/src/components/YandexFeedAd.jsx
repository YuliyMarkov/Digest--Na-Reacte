import { useEffect, useId } from "react";

const ADS_ENABLED = true;
const BLOCK_ID = "R-A-19145977-5";

function YandexFeedAd({ className = "" }) {
  const reactId = useId().replace(/:/g, "").replace(/_/g, "").replace(/-/g, "");

  const renderId = `yandex_feed_${reactId}`;

  useEffect(() => {
    if (!ADS_ENABLED) return;

    const renderAd = () => {
      if (!window.Ya?.Context?.AdvManager) return false;

      try {
        window.Ya.Context.AdvManager.render({
          blockId: BLOCK_ID,
          renderTo: renderId,
          type: "feed",
        });

        return true;
      } catch (error) {
        console.error("Yandex Feed render error:", error);
        return false;
      }
    };

    if (renderAd()) return;

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(renderAd);
  }, [renderId]);

  if (!ADS_ENABLED) return null;

  return (
    <article className={`more-news-card yandex-feed-card ${className}`.trim()}>
      <div className="yandex-feed-card-inner">
        <div id={renderId}></div>
      </div>
    </article>
  );
}

export default YandexFeedAd;
