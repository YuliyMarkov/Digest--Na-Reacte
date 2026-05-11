import { useEffect, useId } from "react";

const ADS_ENABLED = true;

function YandexAdBlock({ className = "" }) {
  const reactId = useId().replace(/:/g, "");
  const renderId = `yandex_rtb_${reactId}`;

  useEffect(() => {
    if (!ADS_ENABLED) return;

    let attempts = 0;

    const interval = setInterval(() => {
      attempts += 1;

      if (
        window.Ya &&
        window.Ya.Context &&
        window.Ya.Context.AdvManager
      ) {
        clearInterval(interval);

        try {
          window.Ya.Context.AdvManager.render({
            blockId: "R-A-19145977-1",
            renderTo: renderId,
          });
        } catch (error) {
          console.error("Yandex RTB render error:", error);
        }
      }

      // перестаём пытаться через 15 секунд
      if (attempts > 30) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
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