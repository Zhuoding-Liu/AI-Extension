const DEFAULT_STATE = {
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
};

let activeTabId = null;
let currentState = { ...DEFAULT_STATE };
let updateTimer = null;

const siteName = document.getElementById("siteName");
const status = document.getElementById("status");
const prompt = document.getElementById("aiPrompt");
const promptButton = document.getElementById("applyPrompt");

function setStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? "#ff918f" : "";
}

function formatValue(key, value) {
  if (["fontScale", "saturation", "brightness"].includes(key)) return `${value}%`;
  if (key === "readingWidth") return Number(value) === 0 ? "不限" : `${value}px`;
  return Number(value).toFixed(1);
}

function render(state) {
  currentState = { ...DEFAULT_STATE, ...state };

  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === currentState.theme);
  });

  document.querySelectorAll("input[data-key]").forEach((input) => {
    const key = input.dataset.key;
    if (input.type === "checkbox") input.checked = Boolean(currentState[key]);
    else input.value = currentState[key];
  });

  document.querySelectorAll("output[data-output]").forEach((output) => {
    output.value = formatValue(output.dataset.output, currentState[output.dataset.output]);
  });
}

async function sendToPage(message) {
  if (!activeTabId) throw new Error("当前页面不可用");
  return chrome.tabs.sendMessage(activeTabId, message);
}

async function applyPatch(patch, quiet = false) {
  currentState = { ...currentState, ...patch };
  render(currentState);
  try {
    const response = await sendToPage({ type: "PAGEFLOW_SET_STATE", patch });
    if (!response?.ok) throw new Error(response?.error || "设置失败");
    currentState = response.state;
    if (!quiet) setStatus("已应用到当前网站");
  } catch (error) {
    setStatus(error.message || "无法修改此页面", true);
  }
}

function schedulePatch(key, value) {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(() => applyPatch({ [key]: value }, true), 70);
}

function localPromptToPatch(text) {
  const value = text.toLowerCase();
  const patch = {};
  const has = (...words) => words.some((word) => value.includes(word));

  if (has("深色", "暗色", "夜间", "dark", "night")) patch.theme = "dark";
  if (has("护眼", "暖色", "柔和", "warm", "sepia")) patch.theme = "warm";
  if (has("高对比", "对比度", "contrast")) patch.theme = "contrast";
  if (has("原始配色", "恢复颜色", "original color")) patch.theme = "original";

  if (has("隐藏图片", "不要图片", "无图", "hide image")) patch.hideImages = true;
  if (has("显示图片", "恢复图片", "show image")) patch.hideImages = false;
  if (has("图片灰度", "黑白图片", "grayscale")) patch.grayscaleImages = true;
  if (has("彩色图片", "恢复彩色")) patch.grayscaleImages = false;
  if (has("易读字体", "清晰字体", "readable font")) patch.readableFont = true;
  if (has("突出链接", "链接下划线", "underline link")) patch.underlineLinks = true;
  if (has("减少动画", "关闭动画", "reduce motion")) patch.reduceMotion = true;
  if (has("聚焦", "专注阅读", "focus")) patch.focusMode = true;
  if (has("窄一点", "阅读宽度", "窄版")) patch.readingWidth = 720;
  if (has("全宽", "不限宽", "wide")) patch.readingWidth = 0;

  if (has("字体大", "放大字体", "大一点", "larger text", "bigger text")) patch.fontScale = Math.min(160, currentState.fontScale + 20);
  if (has("字体小", "缩小字体", "smaller text")) patch.fontScale = Math.max(80, currentState.fontScale - 15);
  if (has("行距大", "宽松", "more spacing")) patch.lineHeight = Math.min(2.2, currentState.lineHeight + 0.3);
  if (has("低饱和", "减少色彩", "less color")) patch.saturation = 65;

  return patch;
}

async function runSmartPrompt() {
  const text = prompt.value.trim();
  if (!text) {
    prompt.focus();
    setStatus("请先描述你想要的页面", true);
    return;
  }

  promptButton.disabled = true;
  setStatus("正在理解你的偏好…");
  try {
    const response = await chrome.runtime.sendMessage({
      type: "PAGEFLOW_AI_REQUEST",
      prompt: text,
      currentState
    });
    if (!response?.ok) throw new Error(response?.error || "AI 请求失败");

    const patch = response.configured ? response.patch : localPromptToPatch(text);
    if (!Object.keys(patch || {}).length) {
      throw new Error(response.configured ? "AI 未返回可用设置" : "暂未识别，请尝试“字体大一点、隐藏图片”");
    }
    await applyPatch(patch);
    document.getElementById("aiMode").textContent = response.configured ? "API 智能" : "本地规则";
    prompt.value = "";
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    promptButton.disabled = false;
  }
}

document.querySelectorAll("[data-theme]").forEach((button) => {
  button.addEventListener("click", () => applyPatch({ theme: button.dataset.theme }));
});

document.querySelectorAll("input[data-key]").forEach((input) => {
  input.addEventListener("input", () => {
    const key = input.dataset.key;
    const value = input.type === "checkbox" ? input.checked : Number(input.value);
    if (input.type === "range") {
      document.querySelector(`[data-output="${key}"]`).value = formatValue(key, value);
      schedulePatch(key, value);
    } else {
      applyPatch({ [key]: value });
    }
  });
});

document.getElementById("resetButton").addEventListener("click", async () => {
  try {
    const response = await sendToPage({ type: "PAGEFLOW_RESET" });
    if (!response?.ok) throw new Error(response?.error || "恢复失败");
    render(response.state);
    setStatus("已恢复此网站的默认显示");
  } catch (error) {
    setStatus(error.message, true);
  }
});

promptButton.addEventListener("click", runSmartPrompt);
prompt.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    runSmartPrompt();
  }
});

document.getElementById("openOptions").addEventListener("click", () => chrome.runtime.openOptionsPage());

async function initialize() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:/.test(tab.url || "")) {
    siteName.textContent = "此浏览器页面不支持修改";
    document.querySelector("main").classList.add("disabled");
    return;
  }

  activeTabId = tab.id;
  try {
    const response = await sendToPage({ type: "PAGEFLOW_GET_STATE" });
    if (!response?.ok) throw new Error("连接失败");
    siteName.textContent = response.site || new URL(tab.url).hostname;
    render(response.state);
    setStatus("设置仅应用于当前网站");
  } catch {
    siteName.textContent = "请刷新页面后再试";
    setStatus("扩展刚安装时需刷新当前页面", true);
  }
}

initialize();
