import { getDarkMode, getColor, getOpacity } from "./utils.js";

class background {
  constructor() {}

  async execute(tabId) {
    const darkModeVal = await getDarkMode();
    const colorval = await getColor();
    const opacityVal = await getOpacity();
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["assets/js/content.js"],
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      await chrome.tabs.sendMessage(tabId, {
        action: "execute",
        params: { darkMode: darkModeVal, color: colorval, opacity: opacityVal },
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  async init() {
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      await chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (
          !tab.url ||
          tab?.url?.startsWith("chrome://") ||
          tab?.url?.startsWith("chrome-extension://") ||
          tab?.url?.startsWith("file://")
        ) {
          return;
        }
        this.execute(activeInfo.tabId);
      });
    });
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (
        !tab.url ||
        tab?.url?.startsWith("chrome://") ||
        tab?.url?.startsWith("chrome-extension://") ||
        tab?.url?.startsWith("file://")
      ) {
        return;
      }
      await this.execute(tabId);
    });
  }
}

new background().init();
