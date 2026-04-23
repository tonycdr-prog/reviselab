import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

export default defineBackground({
  main() {
    browser.runtime.onInstalled.addListener(() => {
      console.log("ReviseLab extension installed.");
    });
  },
});
