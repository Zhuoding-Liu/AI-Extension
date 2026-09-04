const STORAGE_KEY = "pageFlowSiteSettings";

const DEFAULT_STATE = Object.freeze({
  theme: "original",
  hideImages: false,
  grayscaleImages: false,
  readableFont: false,
  underlineLinks: false,
  reduceMotion: false,
  focusMode: false,
  fontScale: 100,
  lineHeight: 1.6,
  saturation: 100,
  brightness: 100,
  readingWidth: 0
});

const ALLOWED_THEMES = new Set(["original", "warm", "dark", "contrast"]);
let currentState = { ...DEFAULT_STATE };

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function sanitizeState(candidate = {}) {
  return {
    theme: ALLOWED_THEMES.has(candidate.theme) ? candidate.theme : DEFAULT_STATE.theme,
    hideImages: Boolean(candidate.hideImages),
    grayscaleImages: Boolean(candidate.grayscaleImages),
    readableFont: Boolean(candidate.readableFont),
    underlineLinks: Boolean(candidate.underlineLinks),
    reduceMotion: Boolean(candidate.reduceMotion),
    focusMode: Boolean(candidate.focusMode),
    fontScale: clamp(candidate.fontScale, 80, 160, DEFAULT_STATE.fontScale),
    lineHeight: clamp(candidate.lineHeight, 1.2, 2.2, DEFAULT_STATE.lineHeight),
    saturation: clamp(candidate.saturation, 0, 200, DEFAULT_STATE.saturation),
    brightness: clamp(candidate.brightness, 60, 140, DEFAULT_STATE.brightness),
    readingWidth: clamp(candidate.readingWidth, 0, 1200, DEFAULT_STATE.readingWidth)
  };
}

function siteKey() {
  return location.origin;
}

function ensureStyles() {
  if (document.getElementById("pageflow-ai-styles")) return;

  const style = document.createElement("style");
  style.id = "pageflow-ai-styles";
  style.textContent = `
    html.pageflow-font-size {
      font-size: var(--pageflow-font-scale, 100%) !important;
    }

    html.pageflow-filter {
      filter: var(--pageflow-filter, none) !important;
    }

    html.pageflow-line-height body {
      line-height: var(--pageflow-line-height, normal) !important;
    }

    html.pageflow-readable-font body,
    html.pageflow-readable-font button,
    html.pageflow-readable-font input,
    html.pageflow-readable-font textarea,
    html.pageflow-readable-font select {
      font-family: Arial, "Noto Sans SC", "Microsoft YaHei", sans-serif !important;
      letter-spacing: 0.015em !important;
    }

    html.pageflow-underlined-links a:not([role="button"]) {
      text-decoration: underline !important;
      text-underline-offset: 0.18em !important;
      text-decoration-thickness: 0.1em !important;
    }

    html.pageflow-hide-images img,
    html.pageflow-hide-images picture,
    html.pageflow-hide-images input[type="image"] {
      display: none !important;
    }

    html.pageflow-grayscale-images img,
    html.pageflow-grayscale-images picture,
    html.pageflow-grayscale-images video {
      filter: grayscale(1) !important;
    }

    html.pageflow-dark img,
    html.pageflow-dark picture,
    html.pageflow-dark video,
    html.pageflow-dark canvas,
    html.pageflow-dark svg,
    html.pageflow-dark [style*="background-image"] {
      filter: invert(1) hue-rotate(180deg) !important;
    }

    html.pageflow-dark.pageflow-grayscale-images img,
    html.pageflow-dark.pageflow-grayscale-images picture,
    html.pageflow-dark.pageflow-grayscale-images video {
      filter: invert(1) hue-rotate(180deg) grayscale(1) !important;
    }

    html.pageflow-warm body {
      background-color: #fffaf0 !important;
    }

    html.pageflow-reduce-motion *,
    html.pageflow-reduce-motion *::before,
    html.pageflow-reduce-motion *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.001ms !important;
    }

    html.pageflow-focus :where(header, nav, aside, footer, [role="banner"], [role="navigation"], [role="complementary"]) {
      opacity: 0.22 !important;
      transition: opacity 160ms ease !important;
    }

    html.pageflow-focus :where(header, nav, aside, footer, [role="banner"], [role="navigation"], [role="complementary"]):hover,
    html.pageflow-focus :where(header, nav, aside, footer, [role="banner"], [role="navigation"], [role="complementary"]):focus-within {
      opacity: 1 !important;
    }

    html.pageflow-reading-width :where(main, article, [role="main"]) {
      box-sizing: border-box !important;
      max-width: var(--pageflow-reading-width) !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function themeFilter(state) {
  const themeFilters = {
    original: "",
    warm: "sepia(0.18)",
    dark: "invert(0.92) hue-rotate(180deg)",
    contrast: "contrast(1.32)"
  };
  const filters = [
    themeFilters[state.theme],
    state.saturation === DEFAULT_STATE.saturation ? "" : `saturate(${state.saturation}%)`,
    state.brightness === DEFAULT_STATE.brightness ? "" : `brightness(${state.brightness}%)`
  ].filter(Boolean).join(" ");
  return filters || "none";
}

function applyState(nextState) {
  currentState = sanitizeState(nextState);
  ensureStyles();

  const root = document.documentElement;
  const classes = [
    "pageflow-font-size",
    "pageflow-line-height",
    "pageflow-filter",
    "pageflow-warm",
    "pageflow-dark",
    "pageflow-readable-font",
    "pageflow-underlined-links",
    "pageflow-hide-images",
    "pageflow-grayscale-images",
    "pageflow-reduce-motion",
    "pageflow-focus",
    "pageflow-reading-width"
  ];
  root.classList.remove(...classes);

  root.classList.toggle("pageflow-font-size", currentState.fontScale !== DEFAULT_STATE.fontScale);
  root.classList.toggle("pageflow-line-height", currentState.lineHeight !== DEFAULT_STATE.lineHeight);
  root.classList.toggle("pageflow-filter", themeFilter(currentState) !== "none");
  root.classList.toggle("pageflow-warm", currentState.theme === "warm");
  root.classList.toggle("pageflow-dark", currentState.theme === "dark");
  root.classList.toggle("pageflow-readable-font", currentState.readableFont);
  root.classList.toggle("pageflow-underlined-links", currentState.underlineLinks);
  root.classList.toggle("pageflow-hide-images", currentState.hideImages);
  root.classList.toggle("pageflow-grayscale-images", currentState.grayscaleImages);
  root.classList.toggle("pageflow-reduce-motion", currentState.reduceMotion);
  root.classList.toggle("pageflow-focus", currentState.focusMode);
  root.classList.toggle("pageflow-reading-width", currentState.readingWidth > 0);

  root.style.setProperty("--pageflow-font-scale", `${currentState.fontScale}%`);
  root.style.setProperty("--pageflow-line-height", String(currentState.lineHeight));
  root.style.setProperty("--pageflow-filter", themeFilter(currentState));
  root.style.setProperty("--pageflow-reading-width", `${currentState.readingWidth}px`);
}

async function saveState(state) {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const settings = stored[STORAGE_KEY] || {};
  settings[siteKey()] = state;
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

async function loadState() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const saved = stored[STORAGE_KEY]?.[siteKey()];
  applyState(saved ? { ...DEFAULT_STATE, ...saved } : DEFAULT_STATE);
}

const initialization = loadState().catch(() => applyState(DEFAULT_STATE));

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PAGEFLOW_GET_STATE") {
    initialization.then(() => sendResponse({ ok: true, state: currentState, site: location.hostname }));
    return true;
  }

  if (message?.type === "PAGEFLOW_SET_STATE") {
    const nextState = sanitizeState({ ...currentState, ...message.patch });
    applyState(nextState);
    saveState(nextState)
      .then(() => sendResponse({ ok: true, state: nextState }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "PAGEFLOW_RESET") {
    applyState(DEFAULT_STATE);
    saveState(DEFAULT_STATE)
      .then(() => sendResponse({ ok: true, state: { ...DEFAULT_STATE } }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});
