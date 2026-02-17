# Тестування

## Архітектура

| Шар          | Розташування             | Призначення                                | Моки                  |
|--------------|--------------------------|--------------------------------------------|------------------------|
| **Unit**     | `tests/unit/`            | Чиста логіка, валідація, утиліти, схеми форм | Без моків              |
| **Integration** | `tests/integration/` | API routes з замокованим Firebase/Stripe   | Firebase, Stripe       |
| **Contracts**   | `tests/contracts/`   | Поведінка API та форма помилок             | Як у integration       |
| **E2E**      | `tests/e2e/`            | Повні потоки (Playwright)                  | Без моків              |

## Три рішення (Solutions)

### Solution #1: Тестувати поведінку та контракти

- **Що:** Перевіряти inputs → outputs і форму відповіді на помилки.
- **Де:** Unit-тести для чистої логіки; contract-тести для API (status + body).
- **Практика:** Щасливий шлях + шлях помилки; перевіряти `{ error, status }` для API.

### Solution #2: Шарувати тести та мокати на межах

- **Що:** Відокремити unit (чиста логіка, без I/O) від integration (замоковані DB/API).
- **Де:** `tests/unit/` — без моків; `tests/integration/` — моки на Firebase/Stripe.
- **Практика:** Чисті функції — без моків; сервіси — інжектувати/фейкувати залежності.

### Solution #3: Явно тестувати шляхи помилок

- **Що:** Для кожного режиму збою мати хоча б один тест.
- **Де:** Unit + integration + contracts.
- **Практика:** Перераховувати режими збою (валідація, 401, 404, 500) і додавати тест на кожен.

## Команди

| Команда                  | Опис                           |
|--------------------------|--------------------------------|
| `npm run test`           | Режим watch (перезапуск при змінах) |
| `npm run test:run`       | Один запуск (Vitest: unit + integration + contracts) |
| `npm run test:unit`      | Тільки unit-тести              |
| `npm run test:integration` | Тільки integration-тести   |
| `npm run test:contracts` | Тільки contract-тести          |
| `npm run test:e2e`       | Playwright E2E (headless)      |
| `npm run test:e2e:ui`    | Playwright UI mode (візуальний режим) |
| `npm run test:e2e:headed`| Playwright з видимим браузером |

**E2E:** Перед першим запуском виконайте `npx playwright install` для встановлення браузерів.

## Мок Firebase Admin

Integration і contract-тести мокають `@/firebase/admin` через `vi.mock`. Мок використовує змінний ref, щоб перемикати між `null` (503) і заглушкою (success/validation/500):

```ts
let adminDbRef: typeof mockAdminDb | null = null
vi.mock('@/firebase/admin', () => ({
  get adminDb() {
    return adminDbRef
  },
}))
```

## Файли тестів

- **Unit:** `cn.test.ts`, `type-name.test.ts`, `prompt-form.test.ts`, `edit-comment.test.ts`
- **Integration:** `types.test.ts`, `types-id.test.ts`, `categories.test.ts`, `tags.test.ts`, `models.test.ts`, `checkout.test.ts`, `checkout-session-status.test.ts`
- **Contracts:** `types.test.ts`, `categories.test.ts`, `tags.test.ts`
- **E2E:** `home.spec.ts`, `pages.spec.ts`, `navigation.spec.ts`, `filters.spec.ts`, `plans.spec.ts`, `community.spec.ts`, `cart.spec.ts`, `docs.spec.ts`, `auth-redirect.spec.ts`, `prompt.spec.ts`, `submit.spec.ts`

## Додавання нових тестів

1. **Чиста логіка** → `tests/unit/lib/<module>.test.ts`
2. **Схема форми** → `tests/unit/lib/schemas/<schema>.test.ts`
3. **API route** → `tests/integration/api/<route>.test.ts` (з моками)
4. **Контракт** → `tests/contracts/api/<route>.test.ts` (status + форма body)
5. **E2E** → `tests/e2e/<flow>.spec.ts` (Playwright)
6. **Шлях помилки** → додати `it('returns 4xx/5xx when...')` у відповідний файл

## Валідація (`src/lib/validation/type-name.ts`)

- Zod: спочатку trim, потім `min(1)`, щоб лише пробіли не проходили валідацію.
- Модуль можна підключати в API routes для однакових повідомлень про помилки.

## Змінні середовища

Тести виконуються без Firebase/Stripe credentials. Моки замінюють реальні звернення до сервісів. Для integration-тестів з реальним Firestore можна використовувати Firebase Emulator (опційно).

Деталі змінних: [09-env.md](09-env.md).

## Playwright MCP

Playwright MCP дозволяє AI (Cursor) керувати браузером: переходити на сторінки, клікати, робити скріншоти, перевіряти вміст. Деталі: [PLAYWRIGHT-MCP.md](PLAYWRIGHT-MCP.md).

## Повна перевірка рішення

Покроковий чеклист (тести, збірка, ручна перевірка сторінок і API): [VERIFICATION.md](VERIFICATION.md).
