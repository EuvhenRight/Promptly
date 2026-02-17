# Full solution verification – step by step

Use this checklist to verify the whole website: logic, APIs, and flows.

---

## 1. Automated tests (run first)

```bash
npm run test:run
```

**Expected:** All test files pass (unit + integration + contracts).

**E2E (Playwright):**

```bash
npx playwright install   # once: installs browsers
npm run test:e2e
```

Runs browser E2E tests (or starts the app via `webServer`). For AI-driven testing via Playwright MCP, see [PLAYWRIGHT-MCP.md](PLAYWRIGHT-MCP.md).

| Layer        | What is tested |
|-------------|-----------------|
| **Unit**    | `cn()`, `validateTypeName()` (incl. whitespace-only), `promptFormSchema`, `editCommentSchema` |
| **Integration** | Types, Types [id] (PATCH/DELETE), Categories, Tags, Models APIs: GET 503, POST 503/400/500/200; Checkout: 400 (missing promptId), 503 (cart without adminDb), 200 (credits/plan), 404 (prompt not found), 500 (Stripe error); Session-status: 400 (missing session_id), 200, 500 |
| **Contracts**   | Types, Categories, Tags APIs: 503/400/500 response shape |
| **E2E (Playwright)** | Home, pages (plans, community, cart, checkout, submit, docs, checkout/return); navigation (header, footer); plans (Choose Your Plan, Monthly/Yearly); community; cart; docs; auth-redirect (account, admin); prompt detail; submit page |

**Covered APIs:** `/api/types`, `/api/categories`, `/api/tags`, `/api/models`, `/api/checkout` (POST), `/api/checkout/session-status` (GET).

**Not covered by tests (manual or add later):**  
`/api/purchase`, `/api/checkout/fulfill`, `/api/admin/sales`, `/api/types/[id]`, `/api/tags/[id]`, `/api/categories/[id]`, `/api/models/[id]`, `/api/search-bar-backgrounds/*`, `/api/upload`.

---

## 2. Build and typecheck

```bash
npm run typecheck
npm run build
```

- **typecheck:** Fix any `tsc --noEmit` errors (e.g. in `src/firebase/provider.tsx` if present).
- **build:** Ensures the Next.js app builds; catches missing env at build time only where used.

---

## 3. Environment

- Copy or create `.env.local` (see `docs/09-env.md`).
- Required for **full** site: Firebase (project, config, optional service account), Stripe keys, `DOMAIN` or `VERCEL_URL` for checkout return URL.
- Tests do **not** need real Firebase/Stripe (mocks are used).

---

## 4. Run the app locally

```bash
npm run dev
```

- Open `http://localhost:9002` (or the port in your script).
- Check: home loads, no runtime errors in console.

---

## 5. Manual verification by area

### 5.1 Public pages

- **Home:** Feed loads (or empty state), filters (if present), search.
- **Prompt page** (`/prompt/[id]`): Loads for a valid id; shows title, description, price, buy button.
- **Plans** (`/plans`): Plans and pricing render.
- **Community** (`/community`): List/feed loads.
- **Docs** (`/docs`, `/docs/testing`): Doc pages and sidebar work.

### 5.2 Auth

- **Sign in** (e.g. Google): Redirect and session work.
- **Account** (`/account`): Profile, wallet, plans, notifications (no 500s).

### 5.3 Checkout flow (critical)

1. **Start checkout:** From a prompt or cart, click buy → redirect/embed to Stripe Checkout.
2. **Return URL:** After payment, return to `/checkout/return?session_id=...` (and any `type`, `promptId`, etc.).
3. **Session status:** Frontend may call `/api/checkout/session-status?session_id=...`; response `status` and `customer_email` are used for UI.
4. **Fulfillment:** Backend `POST /api/checkout/fulfill` (webhook or server) records purchase; confirm in DB or admin.

### 5.4 Admin (if used)

- **Admin panel** (e.g. `/admin`): Dashboard, sales, prompts, categories, tags, types, models, users, payouts, search-bar backgrounds.
- **CRUD:** Create/edit/delete for prompts, categories, tags, types, models; no 500 on save.

### 5.5 API smoke (optional)

With the app running, use curl or browser:

- `GET /api/types` → 200 + JSON array (or 503 if Firebase not configured).
- `GET /api/categories` → same.
- `GET /api/tags` → same.
- `GET /api/models` → same.
- `GET /api/checkout/session-status` → 400 (missing `session_id`).
- `POST /api/checkout` with `{ "type": "credits", "credits": 300 }` → 200 + `clientSecret` (if Stripe is configured).

---

## 6. Summary

| Step | Command / action        | Pass criteria                    |
|------|-------------------------|-----------------------------------|
| 1    | `npm run test:run`      | All tests pass                   |
| 2    | `npm run typecheck`     | No TS errors                     |
| 2    | `npm run build`         | Build succeeds                   |
| 3    | Env vars                | `.env.local` (or equiv) set      |
| 4    | `npm run dev`           | App runs, home loads             |
| 5    | Manual: pages, auth, checkout, admin | No crashes, key flows work |
| 6    | Optional: API smoke    | GET/POST responses as above      |

When all steps pass, the full solution (logic, covered APIs, and main flows) is verified for the current codebase.
