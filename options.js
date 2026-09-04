const STORAGE_KEY = "pageFlowAiConfig";
const form = document.getElementById("aiForm");
const endpoint = document.getElementById("endpoint");
const model = document.getElementById("model");
const apiKey = document.getElementById("apiKey");
const status = document.getElementById("status");

async function load() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const config = stored[STORAGE_KEY] || {};
  endpoint.value = config.endpoint || "";
  model.value = config.model || "";
  apiKey.value = config.apiKey || "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = endpoint.value.trim();
  if (url) {
    let originPattern;
    try {
      originPattern = `${new URL(url).origin}/*`;
    } catch {
      status.textContent = "请输入有效的 API 地址";
      status.style.color = "#c34e4e";
      return;
    }

    const granted = await chrome.permissions.request({ origins: [originPattern] });
    if (!granted) {
      status.textContent = "需要授权该 API 域名才能发送请求";
      status.style.color = "#c34e4e";
      return;
    }
  }

  await chrome.storage.local.set({
    [STORAGE_KEY]: { endpoint: url, model: model.value.trim(), apiKey: apiKey.value.trim() }
  });
  status.textContent = url ? "配置已保存，可以在插件中使用 AI" : "已保存：继续使用本地规则";
  status.style.color = "#3f8a63";
});

document.getElementById("clear").addEventListener("click", async () => {
  endpoint.value = "";
  model.value = "";
  apiKey.value = "";
  await chrome.storage.local.set({ [STORAGE_KEY]: { endpoint: "", model: "", apiKey: "" } });
  status.textContent = "AI 配置已清除";
  status.style.color = "#3f8a63";
});

load();
