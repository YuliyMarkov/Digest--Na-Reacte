import { useEffect, useId } from "react";

const ADS_ENABLED = true;

const AD_SLOTS = {
  fluid: {
    slot: "8383624763",
    format: "fluid",
    layoutKey: "-6g+c5+15-k+cg",
  },
  news: {
    slot: "2022230542",
    format: "auto",
    fullWidthResponsive: true,
  },
};

function AdBlock({ type = "news", className = "" }) {
  const reactId = useId();
  const adKey = reactId.replace(/:/g, "");
  const config = AD_SLOTS[type] || AD_SLOTS.news;

  useEffect(() => {
    if (!ADS_ENABLED) return;

    const timer = setTimeout(() => {
      try {
        const ads = document.querySelectorAll(".adsbygoogle");

        ads.forEach((ad) => {
          // если уже отрендерено — не трогаем
          if (ad.getAttribute("data-adsbygoogle-status") === "done") return;

          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
        });
      } catch (error) {
        console.error("AdSense render error:", error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!ADS_ENABLED) return null;

  return (
    <section
      className={`horizontal-ad adsense-block adsense-block-${type} ${className}`.trim()}
      aria-label="Реклама"
    >
      <div className="horizontal-ad-box">
        <div className="horizontal-ad-link">
          <ins
            key={adKey}
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-9284192456639550"
            data-ad-slot={config.slot}
            data-ad-format={config.format}
            {...(config.layoutKey
              ? { "data-ad-layout-key": config.layoutKey }
              : {})}
            {...(config.fullWidthResponsive
              ? { "data-full-width-responsive": "true" }
              : {})}
          />
        </div>
      </div>
    </section>
  );
}

export default AdBlock;