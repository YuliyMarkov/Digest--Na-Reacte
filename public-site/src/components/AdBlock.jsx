import { useEffect, useRef } from "react";

const ADS_ENABLED = true;

function AdBlock({ className = "" }) {
  const adRef = useRef(null);

  useEffect(() => {
    if (!ADS_ENABLED || !adRef.current) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.error("AdSense render error:", error);
    }
  }, []);

  if (!ADS_ENABLED) return null;

  return (
    <section
      className={`horizontal-ad adsense-block ${className}`.trim()}
      aria-label="Реклама"
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-9284192456639550"
        data-ad-slot="2377228427"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </section>
  );
}

export default AdBlock;