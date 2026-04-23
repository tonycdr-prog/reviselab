import "@carbon/styles/css/styles.css";
import "@reviselab/ui/styles.css";

import { createRoot, type Root } from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";

import { OverleafPanelApp } from "../src/components/overleaf-panel-app";

export default defineContentScript({
  matches: ["*://www.overleaf.com/project/*"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "reviselab-overleaf-panel",
      position: "overlay",
      alignment: "top-right",
      zIndex: 2147483647,
      anchor: "body",
      append: "last",
      onMount(container) {
        const root = createRoot(container);
        root.render(<OverleafPanelApp />);
        return root;
      },
      onRemove(root) {
        (root as Root | undefined)?.unmount();
      },
    });

    ui.mount();
  },
});
