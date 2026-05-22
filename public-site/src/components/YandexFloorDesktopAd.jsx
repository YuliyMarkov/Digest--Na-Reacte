import { useEffect } from "react";

const BLOCK_ID = "R-A-19145977-7";

function YandexFloorDesktopAd() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.yaContextCb = window.yaContextCb || [];

    window.yaContextCb.push(() => {
      if (!window.Ya?.Context?.AdvManager) return;

      window.Ya.Context.AdvManager.render({
        blockId: BLOCK_ID,
        type: "floorAd",
        platform: "desktop",
      });
    });
  }, []);

  return null;
}

export default YandexFloorDesktopAd;