import {
  setColor,
  setDarkMode,
  setOpacity,
  getDarkMode,
  getOpacity,
  getColor,
} from "./utils.js";

class Popup {
  constructor() {}

  static DEFAULTS = {
    darkMode: false,
    opacity: "0.5",
    color: "rgb(75, 85, 99)",
  };

  selectedColor = Popup.DEFAULTS.color;

  normalizeToHex = (colorValue) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return "#4b5563";
    }
    ctx.fillStyle = "#4b5563";
    ctx.fillStyle = colorValue || "#4b5563";
    const normalized = String(ctx.fillStyle);
    return normalized.startsWith("#") ? normalized : "#4b5563";
  };

  updateSnapshot = ({ color, opacity }) => {
    const snapshotColor = document.getElementById("snapshotColor");
    const snapshotOpacity = document.getElementById("snapshotOpacity");
    if (snapshotColor) {
      snapshotColor.textContent = color || Popup.DEFAULTS.color;
    }
    if (snapshotOpacity) {
      const value = Math.round(Number(opacity) * 100);
      snapshotOpacity.textContent = `${value}%`;
    }
  };

  updateModeStatus = (enabled) => {
    const modeStatus = document.getElementById("modeStatus");
    if (!modeStatus) {
      return;
    }
    modeStatus.textContent = enabled ? "On" : "Off";
    modeStatus.classList.toggle("active", enabled);
  };

  updateOpacityValue = (opacityValue) => {
    const opacityLabel = document.getElementById("opacityValue");
    const opacityInput = document.getElementById("opacity");
    if (!opacityLabel) {
      return;
    }
    const value = Math.round(Number(opacityValue) * 100);
    opacityLabel.textContent = `${value}%`;
    if (opacityInput) {
      opacityInput.style.setProperty("--opacity-percent", `${value}%`);
    }
  };

  updateOpacityPresets = (opacityValue) => {
    const presets = document.querySelectorAll(".preset-btn");
    const target = Number(opacityValue);
    for (const preset of presets) {
      const presetValue = Number(preset.dataset.opacity);
      const isActive = Math.abs(presetValue - target) <= 0.001;
      preset.classList.toggle("active", isActive);
    }
  };

  updateColorPreview = (colorValue) => {
    const previewDot = document.getElementById("colorPreview");
    if (!previewDot) {
      return;
    }
    previewDot.style.backgroundColor = colorValue || Popup.DEFAULTS.color;
  };

  setCustomButtonState = (active) => {
    const applyCustomColor = document.getElementById("applyCustomColor");
    applyCustomColor?.classList.toggle("active", active);
  };

  getSelectedColor = () => {
    return (
      this.selectedColor ||
      document.querySelector(".color-item.active")?.style?.backgroundColor ||
      document.getElementById("customColor")?.value ||
      Popup.DEFAULTS.color
    );
  };

  isSupportedUrl = (url) => {
    return Boolean(
      url &&
        !url.startsWith("chrome://") &&
        !url.startsWith("chrome-extension://") &&
        !url.startsWith("edge://") &&
        !url.startsWith("about:") &&
        !url.startsWith("devtools://") &&
        !url.startsWith("view-source:")
    );
  };

  sendToTabWithRetry = async (tabId, params) => {
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
        return;
      }
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["assets/js/content.js"],
      });
      await chrome.tabs.sendMessage(tabId, {
        action: "execute",
        params,
      });
    } catch (error) {
      // Unsupported pages do not accept content scripts.
    }
  };

  sendToAllTabs = async (params) => {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab?.id || !this.isSupportedUrl(tab?.url)) {
        continue;
      }
      await this.sendToTabWithRetry(tab.id, params);
    }
  };

  darkModeEvent = async () => {
    const darkMode = document.getElementById("darkMode");
    const opacity = document.getElementById("opacity");
    this.updateOpacityValue(opacity.value);
    this.updateOpacityPresets(opacity.value);
    this.updateModeStatus(darkMode.checked);
    const colorval = this.getSelectedColor()
      ? this.getSelectedColor()
      : "transparent";
    this.updateColorPreview(colorval);
    this.updateSnapshot({ color: colorval, opacity: opacity.value });
    await setDarkMode(darkMode.checked);
    await setColor(colorval);
    await setOpacity(opacity.value);
    await this.sendToAllTabs({
      darkMode: darkMode.checked,
      color: colorval,
      opacity: opacity.value,
    });
  };

  resetDefaults = async () => {
    const darkMode = document.getElementById("darkMode");
    const opacity = document.getElementById("opacity");
    const colorPickers = document.querySelectorAll(".color-item");
    const customColor = document.getElementById("customColor");

    darkMode.checked = Popup.DEFAULTS.darkMode;
    opacity.value = Popup.DEFAULTS.opacity;
    this.selectedColor = Popup.DEFAULTS.color;
    customColor.value = this.normalizeToHex(Popup.DEFAULTS.color);

    for (const colorPicker of colorPickers) {
      colorPicker.classList.remove("active");
      if (colorPicker.style.backgroundColor === Popup.DEFAULTS.color) {
        colorPicker.classList.add("active");
      }
    }
    this.setCustomButtonState(false);

    if (!document.querySelector(".color-item.active") && colorPickers.length > 0) {
      colorPickers[0].classList.add("active");
      this.selectedColor = colorPickers[0].style.backgroundColor;
    }

    await this.darkModeEvent();
  };

  opacityPresetSelect = async (e) => {
    const opacity = document.getElementById("opacity");
    opacity.value = e.currentTarget.dataset.opacity;
    await this.darkModeEvent();
  };

  colorPickerSelect = async (e) => {
    const colorPickers = document.querySelectorAll(".color-item");
    const customColor = document.getElementById("customColor");
    for (let colorPicker of colorPickers) {
      colorPicker.classList.remove("active");
    }
    e.currentTarget.classList.add("active");
    this.selectedColor = e.currentTarget.style.backgroundColor;
    customColor.value = this.normalizeToHex(this.selectedColor);
    this.setCustomButtonState(false);
    await this.darkModeEvent();
  };

  applyCustomColor = async () => {
    const customColor = document.getElementById("customColor");
    const colorPickers = document.querySelectorAll(".color-item");
    for (let colorPicker of colorPickers) {
      colorPicker.classList.remove("active");
    }
    this.selectedColor = customColor.value;
    this.setCustomButtonState(true);
    await this.darkModeEvent();
  };

  init = async () => {
    const darkMode = document.getElementById("darkMode");
    const opacity = document.getElementById("opacity");
    const customColor = document.getElementById("customColor");
    const applyCustomColor = document.getElementById("applyCustomColor");
    const colorPickers = document.querySelectorAll(".color-item");
    const darkModeVal = await getDarkMode();
    const opacityVal = await getOpacity();
    const colorVal = await getColor();
    const presets = document.querySelectorAll(".preset-btn");
    const resetButton = document.getElementById("resetDefaults");

    darkMode.checked = darkModeVal;
    opacity.value = opacityVal;
    this.updateModeStatus(darkModeVal);
    this.updateOpacityValue(opacityVal);
    this.updateOpacityPresets(opacityVal);
    this.updateColorPreview(colorVal);
    this.updateSnapshot({ color: colorVal, opacity: opacityVal });
    this.selectedColor = colorVal;
    customColor.value = this.normalizeToHex(colorVal);
    this.setCustomButtonState(false);

    let hasActiveColor = false;
    for (let colorPicker of colorPickers) {
      colorPicker.classList.remove("active");
      if (colorPicker.style.backgroundColor === colorVal) {
        colorPicker.classList.add("active");
        hasActiveColor = true;
      }
      colorPicker.addEventListener("click", this.colorPickerSelect);
    }

    for (const preset of presets) {
      preset.addEventListener("click", this.opacityPresetSelect);
    }

    if (!hasActiveColor) {
      this.selectedColor = colorVal;
      this.setCustomButtonState(true);
      this.updateColorPreview(colorVal);
    }

    darkMode.addEventListener("change", this.darkModeEvent);
    opacity.addEventListener("input", this.darkModeEvent);
    resetButton?.addEventListener("click", this.resetDefaults);
    applyCustomColor?.addEventListener("click", this.applyCustomColor);
    customColor?.addEventListener("input", this.applyCustomColor);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  const popup = new Popup();
  await popup.init();
});
