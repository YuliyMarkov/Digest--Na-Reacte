import { useEffect } from "react";

const ADS_ENABLED = true;

function YandexFullscreenAd() {
  useEffect(() => {
    if (!ADS_ENABLED) return;

    const renderFullscreen = () => {
      if (!window.Ya?.Context?.AdvManager) return false;

      try {
        window.Ya.Context.AdvManager.render({
          blockId: "R-A-19145977-4",
          type: "fullscreen",
          platform: "touch",
        });

        return true;
      } catch (error) {
        console.error("Yandex fullscreen render error:", error);
        return false;
      }
    };

    if (renderFullscreen()) return;

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(renderFullscreen);
  }, []);

  return null;
}

export default YandexFullscreenAd;