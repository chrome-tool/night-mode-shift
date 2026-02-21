import { getDarkMode, getColor, getOpacity } from "./utils.js";

class background {
  constructor() {}

  isSupportedUrl(url) {
    return Boolean(
      url &&
        !url.startsWith("chrome://") &&
        !url.startsWith("chrome-extension://") &&
        !url.startsWith("edge://") &&
        !url.startsWith("about:") &&
        !url.startsWith("devtools://") &&
        !url.startsWith("view-source:")
    );
  }

  async sendWithRetry(tabId, params) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: "execute",
        params,
      });
      return;
    } catch (error) {
      const noReceiver = String(error?.message || "").includes(
        "Could not establish connection. Receiving end does not exist."
      );
      if (!noReceiver) {
        throw error;
      }
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["assets/js/content.js"],
    });

    await chrome.tabs.sendMessage(tabId, {
      action: "execute",
      params,
    });
  }

  async execute(tabId) {
    const darkModeVal = await getDarkMode();
    const colorval = await getColor();
    const opacityVal = await getOpacity();
    const params = {
      darkMode: darkModeVal,
      color: colorval,
      opacity: opacityVal,
    };

    try {
      await this.sendWithRetry(tabId, params);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  async executeForTab(tab) {
    if (!tab?.id || !this.isSupportedUrl(tab?.url)) {
      return;
    }
    await this.execute(tab.id);
  }

  async syncExistingTabs() {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      await this.executeForTab(tab);
    }
  }

  async init() {
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      await this.executeForTab(tab);
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status !== "complete" || !this.isSupportedUrl(tab?.url)) {
        return;
      }
      await this.execute(tabId);
    });

    await this.syncExistingTabs();
  }
}

new background().init();
