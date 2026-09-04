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
      status.textContent = "Enter a valid API endpoint.";
      status.style.color = "#c34e4e";
      return;
    }

    const granted = await chrome.permissions.request({ origins: [originPattern] });
    if (!granted) {
      status.textContent = "Permission for this API domain is required to send requests.";
      status.style.color = "#c34e4e";
      return;
    }
  }

  await chrome.storage.local.set({
    [STORAGE_KEY]: { endpoint: url, model: model.value.trim(), apiKey: apiKey.value.trim() }
  });
  status.textContent = url ? "Configuration saved. AI is ready to use." : "Saved. Local rules will remain active.";
  status.style.color = "#3f8a63";
});

document.getElementById("clear").addEventListener("click", async () => {
  endpoint.value = "";
  model.value = "";
  apiKey.value = "";
  await chrome.storage.local.set({ [STORAGE_KEY]: { endpoint: "", model: "", apiKey: "" } });
  status.textContent = "AI configuration cleared.";
  status.style.color = "#3f8a63";
});

load();
