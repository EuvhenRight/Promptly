# Playwright MCP for testing

## What is Playwright MCP?

Playwright MCP is a Model Context Protocol server that exposes browser automation to AI (Cursor, etc.). You can ask the AI to navigate your site, click, fill forms, take screenshots, and verify content — all via natural language.

## Setup

1. **Playwright MCP** is configured in Cursor/Gemini (`.gemini/settings.json`):

```json
"playwright": {
  "command": "npx",
  "args": ["-y", "@executeautomation/playwright-mcp-server"]
}
```

2. **Dev server** must be running for live testing:

```bash
npm run dev
```

3. **E2E tests** (automated) use `@playwright/test`:

```bash
npm install
npx playwright install   # installs browsers (chromium, firefox, webkit)
npm run test:e2e
```

## Using Playwright MCP in Cursor

Once the MCP server is active and the app is running, you can:

- **"Navigate to http://localhost:9002/docs/testing"** — open the testing doc page
- **"Take a screenshot of the current page"** — capture the viewport
- **"Click the 'Тестування' link in the sidebar"** — interact with the UI
- **"Fill the search input with 'testing'"** — type into inputs
- **"Check if the page shows 'Тестування' text"** — verify content
- **"Go to /api/types and show me the response"** — use `playwright_get` for API checks

## MCP tools available

| Tool | Use |
|------|-----|
| `playwright_navigate` | Open a URL |
| `playwright_click` | Click an element |
| `playwright_fill` | Type into inputs |
| `playwright_screenshot` | Capture page or element |
| `playwright_get_visible_text` | Read visible text |
| `playwright_get_visible_html` | Read HTML |
| `playwright_get` | HTTP GET request |
| `playwright_post` | HTTP POST request |
| `playwright_start_codegen_session` | Record actions as a test |
| `playwright_resize` | Resize viewport (e.g. mobile) |

## Workflow: MCP + automated tests

1. **Exploratory** — Use MCP to navigate, click, and verify flows manually.
2. **Record** — Use `playwright_start_codegen_session` to record a test while you interact.
3. **Automate** — Save the generated test to `tests/e2e/*.spec.ts`.
4. **CI** — Run `npm run test:e2e` in CI with `webServer` starting the app.

## Commands

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run Playwright E2E tests (headless) |
| `npm run test:e2e:ui` | Playwright UI mode (visual, debug) |
| `npm run test:e2e:headed` | Run tests with visible browser |

## Base URL

- **Local dev:** `http://localhost:9002`
- **Playwright config:** `playwright.config.ts` sets `baseURL` and `webServer` to start the app.
