import { useEffect, useId, useRef } from "react";

const ADS_ENABLED = false;

const AD_SLOTS = {
  news: {
    slot: "2377228427",
    format: "auto",
    fullWidthResponsive: true,
  },
};

function AdBlock({ type = "news", className = "" }) {
  const reactId = useId();
  const adRef = useRef(null);
  const adKey = `${type}-${reactId.replace(/:/g, "")}`;
  const config = AD_SLOTS[type] || AD_SLOTS.news;

  useEffect(() => {
    if (!ADS_ENABLED || !adRef.current) return;

    const adElement = adRef.current;

    if (adElement.getAttribute("data-adsbygoogle-status") === "done") return;

    const timer = setTimeout(() => {
      try {
        if (adElement.getAttribute("data-adsbygoogle-status") === "done") {
          return;
        }

        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch (error) {
        console.error("AdSense render error:", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [adKey]);

  if (!ADS_ENABLED) return null;

  return (
    <section
      className={`horizontal-ad adsense-block adsense-block-news ${className}`.trim()}
      aria-label="Реклама"
    >
      <div className="horizontal-ad-box">
        <div className="horizontal-ad-link">
          <ins
            ref={adRef}
            key={adKey}
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-9284192456639550"
            data-ad-slot={config.slot}
            data-ad-format={config.format}
            data-full-width-responsive={
              config.fullWidthResponsive ? "true" : "false"
            }
          />
        </div>
      </div>
    </section>
  );
}

export default AdBlock;