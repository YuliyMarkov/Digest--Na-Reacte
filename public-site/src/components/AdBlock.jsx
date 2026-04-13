const ADS_ENABLED = false;

function AdBlock({ className = "" }) {
  if (!ADS_ENABLED) return null;

  return (
    <section
      className={`horizontal-ad adsense-block ${className}`.trim()}
      aria-label="Реклама"
    >
      <div className="horizontal-ad-box">
        <div className="horizontal-ad-link">
          <div className="adsense-slot adsense-slot-horizontal">
            {/* Google AdSense horizontal slot */}

            {/* Когда подключишь AdSense — раскомментируй и вставь свои данные */}
            {/*
            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXX"
              data-ad-slot="XXXXXXXXXX"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
            */}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdBlock;