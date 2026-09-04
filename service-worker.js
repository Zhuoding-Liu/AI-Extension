const AI_CONFIG_KEY = "pageFlowAiConfig";

const SYSTEM_PROMPT = `You are an accessibility-focused webpage customization engine.
Return only a JSON object containing any of these fields:
theme: "original" | "warm" | "contrast"
hideImages, grayscaleImages, readableFont, underlineLinks, reduceMotion, focusMode: boolean
fontScale: number from 80 to 160
lineHeight: number from 1.2 to 2.2
saturation: number from 0 to 200
brightness: number from 60 to 140
readingWidth: 0 or number from 480 to 1200.
Use the user's language and intent. Do not include markdown.`;

function extractJson(text) {
  if (typeof text === "object" && text !== null) return text;
  const cleaned = String(text || "").replace(/```(?:json)?|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The AI did not return valid settings.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function requestAi(prompt, currentState) {
  const stored = await chrome.storage.local.get(AI_CONFIG_KEY);
  const config = stored[AI_CONFIG_KEY];
  if (!config?.endpoint) return { configured: false };

  const headers = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model || undefined,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Current settings: ${JSON.stringify(currentState)}\nRequest: ${prompt}`
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API request failed (${response.status}): ${detail.slice(0, 160)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? data.output_text ?? data.result ?? data;
  return { configured: true, patch: extractJson(content) };
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(AI_CONFIG_KEY).then((stored) => {
    if (!stored[AI_CONFIG_KEY]) {
      chrome.storage.local.set({
        [AI_CONFIG_KEY]: { endpoint: "", model: "", apiKey: "" }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "PAGEFLOW_AI_REQUEST") return;

  requestAi(message.prompt, message.currentState)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});
