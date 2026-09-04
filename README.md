# PageFlow AI

A build-free Chrome / Edge Manifest V3 extension for customizing webpage appearance and accessibility. Preferences are saved per website, and an AI-compatible API layer is ready for future customization.

## Features

- Original, warm, and high-contrast page themes
- One-click image hiding, grayscale images, readable fonts, and highlighted links
- Reading focus, reduced motion, text size, line spacing, saturation, brightness, and reading width
- Per-website settings with one-click reset
- English natural-language shortcuts using local rules
- Optional Chat Completions-compatible API integration

## Install and test

1. Open `chrome://extensions/` in Chrome or `edge://extensions/` in Edge.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `AI-Extension` directory.
4. Open and refresh a regular webpage, then click PageFlow AI in the browser toolbar.

After changing the code, click **Reload** for the extension and refresh the webpage you are testing.

## AI integration

Click **AI settings** at the bottom of the popup and enter an endpoint that supports the OpenAI Chat Completions request and response format. Use your own backend proxy to keep provider credentials secure. Saving an API key directly in the extension is suitable only for personal development because users of the device can read extension storage.

The AI response should contain a JSON object such as:

```json
{
  "theme": "warm",
  "fontScale": 120,
  "lineHeight": 1.8,
  "hideImages": true,
  "reduceMotion": true
}
```

Allowed fields and ranges are documented in the system prompt in `service-worker.js`. Values are validated again by `content-script.js` before being applied.

## Project structure

- `manifest.json`: extension metadata and permissions
- `popup.*`: toolbar popup interface and interactions
- `content-script.js`: page styling, state validation, and per-site storage
- `service-worker.js`: AI service adapter
- `options.*`: AI configuration page

## Before publishing

- Authenticate through a backend proxy instead of distributing third-party API keys to clients.
- Review website access permissions and prepare a privacy policy.
- Test compatibility across common content sites, single-page applications, video sites, and high-contrast modes.
