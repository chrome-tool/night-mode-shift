const DEFAULTS = {
  darkMode: false,
  color: "rgb(93, 93, 93)",
  opacity: "0.5",
};

function execute(params = DEFAULTS) {
  let screenCoverDiv = document.getElementById("screen-cover");
  if (!screenCoverDiv) {
    screenCoverDiv = document.createElement("div");
    screenCoverDiv.id = "screen-cover";
    screenCoverDiv.style.cssText =
      "z-index: 2147483646;margin: 0;border-radius: 0;position: fixed;top: -10%;right: -10%;width: 120%;height: 120%;pointer-events: none;mix-blend-mode: multiply;display: block;opacity: 0;";
    document.documentElement.appendChild(screenCoverDiv);
  }

  const darkModeVal = Boolean(params.darkMode);
  const colorVal = params.color ?? DEFAULTS.color;
  const opacityVal = params.opacity ?? DEFAULTS.opacity;

  if (darkModeVal) {
    screenCoverDiv.style.backgroundColor = colorVal;
    screenCoverDiv.style.opacity = opacityVal;
    screenCoverDiv.style.display = "block";
  } else {
    screenCoverDiv.style.display = "none";
  }
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action !== "execute") {
    return;
  }
  execute(request.params ?? DEFAULTS);
});

(function () {
  execute(DEFAULTS);
})();
