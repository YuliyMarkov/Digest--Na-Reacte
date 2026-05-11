import { useEffect, useId } from "react";

const ADS_ENABLED = true;

function YandexAdBlock({ className = "" }) {
  const reactId = useId().replace(/:/g, "");
  const renderId = `yandex_rtb_${reactId}`;

  useEffect(() => {
    if (!ADS_ENABLED) return;

    window.yaContextCb = window.yaContextCb || [];

    window.yaContextCb.push(() => {
      if (!window.Ya?.Context?.AdvManager) return;

      window.Ya.Context.AdvManager.render({
        blockId: "R-A-19145977-1",
        renderTo: renderId,
      });
    });
  }, [renderId]);

  if (!ADS_ENABLED) return null;

  return (
    <section
      className={`horizontal-ad yandex-ad-block ${className}`.trim()}
      aria-label="Реклама"
    >
      <div id={renderId}></div>
    </section>
  );
}

export default YandexAdBlock;