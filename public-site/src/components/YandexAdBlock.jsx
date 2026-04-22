import { useEffect } from "react";

function YandexAdBlock() {
  useEffect(() => {
    if (!window.yaContextCb) {
      window.yaContextCb = [];
    }

    window.yaContextCb.push(() => {
      if (window.Ya?.Context?.AdvManager) {
        window.Ya.Context.AdvManager.render({
          blockId: "R-A-19145977-1",
          renderTo: "yandex_rtb_R-A-19145977-1",
        });
      }
    });
  }, []);

  return <div id="yandex_rtb_R-A-19145977-1"></div>;
}

export default YandexAdBlock;