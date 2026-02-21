export async function getDarkMode() {
  const result = await chrome.storage.local.get(["darkMode", "darkmode"]);
  return result.darkMode ?? result.darkmode ?? false;
}
export async function setDarkMode(darkMode) {
  await chrome.storage.local.set({ darkMode: darkMode, darkmode: darkMode });
}
export async function getColor() {
  return (await chrome.storage.local.get("color")).color ?? "rgb(93, 93, 93)";
}
export async function setColor(color) {
  await chrome.storage.local.set({ color });
}
export async function getOpacity() {
  return (await chrome.storage.local.get("opacity")).opacity ?? "0.5";
}
export async function setOpacity(opacity) {
  await chrome.storage.local.set({ opacity });
}
