# Testing Guide

> Документація також доступна в веб-інтерфейсі: `/docs/testing`.

## Architecture

| Layer        | Location                  | Purpose                               | Mocks                 |
|--------------|---------------------------|---------------------------------------|------------------------|
| **Unit**     | `tests/unit/`             | Pure logic, validation, utils, form schemas | None                   |
| **Integration** | `tests/integration/`   | API routes with mocked Firebase/Stripe| Firebase, Stripe      |
| **Contracts**   | `tests/contracts/`     | API behavior + error shapes           | Same as integration   |
| **E2E**      | `tests/e2e/`             | Full flows (Playwright)               | None                   |

## Test files (current)

- `tests/setup.ts` — Vitest setup (jest-dom matchers).
- **Unit:** `cn.test.ts`, `type-name.test.ts`, `prompt-form.test.ts`, `edit-comment.test.ts`
- **Integration:** `types.test.ts`, `types-id.test.ts` (PATCH/DELETE), `categories.test.ts`, `tags.test.ts`, `models.test.ts`, `checkout.test.ts`, `checkout-session-status.test.ts`
- **Contracts:** `types.test.ts`, `categories.test.ts`, `tags.test.ts`
- **E2E:** `home.spec.ts`, `pages.spec.ts`, `navigation.spec.ts`, `filters.spec.ts`, `plans.spec.ts`, `community.spec.ts`, `cart.spec.ts`, `docs.spec.ts`, `auth-redirect.spec.ts`, `prompt.spec.ts`, `submit.spec.ts`

Before first E2E run: `npx playwright install`.

For **Playwright MCP** (AI-driven browser testing via Cursor), see [PLAYWRIGHT-MCP.md](PLAYWRIGHT-MCP.md).

For a **full solution verification** (tests + build + manual flows), see [VERIFICATION.md](VERIFICATION.md).

## The Three Solutions

### Solution #1: Test behavior and contracts

- **What:** Assert inputs → outputs and error response shape.
- **Where:** Unit tests for pure logic; contract tests for API status + body.
- **Practice:** Happy path + error path for each unit; assert `{ error, status }` for APIs.

### Solution #2: Layer tests and mock at boundaries

- **What:** Separate unit (pure, no I/O) from integration (mocked DB/APIs).
- **Where:** `tests/unit/` = no mocks; `tests/integration/` = mocks at Firebase/Stripe.
- **Practice:** Pure functions = no mocks; services = inject/fake dependencies.

### Solution #3: Explicitly test error paths

- **What:** Every failure mode has at least one test.
- **Where:** Unit + integration + contracts.
- **Practice:** List failure modes (validation, 401, 404, 500) and add a test per mode.

## Commands

| Command              | Description                    |
|----------------------|--------------------------------|
| `npm run test`       | Watch mode (re-run on change)  |
| `npm run test:run`   | Single run (Vitest: unit + integration + contracts) |
| `npm run test:unit`  | Unit tests only                |
| `npm run test:integration` | Integration tests only  |
| `npm run test:contracts`   | Contract tests only      |
| `npm run test:e2e`   | Playwright E2E (headless)      |
| `npm run test:e2e:ui`| Playwright UI mode            |
| `npm run test:e2e:headed` | Playwright with visible browser |

## Mocking Firebase Admin

Integration and contract tests mock `@/firebase/admin` via `vi.mock`. The mock uses a mutable ref so tests can switch between `null` (503) and a stub (success/validation/500):

```ts
let adminDbRef: typeof mockAdminDb | null = null
vi.mock('@/firebase/admin', () => ({
  get adminDb() {
    return adminDbRef
  },
}))
```

## Adding New Tests

1. **Pure logic** → `tests/unit/lib/<module>.test.ts`
2. **Form schema** → `tests/unit/lib/schemas/<schema>.test.ts`
3. **API route** → `tests/integration/api/<route>.test.ts` (with mocks)
4. **Contract** → `tests/contracts/api/<route>.test.ts` (status + body shape)
5. **E2E** → `tests/e2e/<flow>.spec.ts` (Playwright)
6. **Error path** → Add a `it('returns 4xx/5xx when...')` in the relevant file

## Validation module (`src/lib/validation/type-name.ts`)

- Uses Zod: trim first, then require `min(1)` so whitespace-only input fails validation.
- Shared by unit tests and can be used by API routes for consistent error messages.
