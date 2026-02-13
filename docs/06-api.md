# API Reference

## Загальне

- Базовий URL: той самий origin, що й фронт (наприклад, `https://your-app.vercel.app` або `http://localhost:9002`).
- Усі API повертають JSON. При помилках — HTTP 4xx/5xx та об’єкт `{ error: string }`.
- Де потрібна авторизація — заголовок `Authorization: Bearer <Firebase ID token>`.

---

## Checkout (Stripe)

### POST /api/checkout

Створює Stripe Checkout Session (embedded).

**Body (JSON):**

| Поле | Тип | Опис |
|------|-----|------|
| type | `'prompt' \| 'credits' \| 'plan' \| 'cart'` | Тип покупки (опційно, виводиться з promptId/promptIds). |
| userId | string | Опційно, для метаданих. |
| promptId | string | Для type=prompt. |
| promptIds | string[] | Для type=cart. |
| title, price, description, image | — | Для prompt, якщо немає Firebase Admin (fallback). |
| credits | number | 1000 або 2000 для type=credits. |
| plan | `'starter' \| 'pro'` | Для type=plan. |
| billing | `'monthly' \| 'yearly'` | Для type=plan. |

**Відповідь:** `{ clientSecret, currency, amountCents }` — для Stripe Embedded Checkout.

**Помилки:** 400 (невірні дані), 404 (prompt not found), 503 (Firebase Admin недоступний).

---

### GET /api/checkout/session-status?session_id=...

Перевірка статусу сесії Stripe (опційно використовується на клієнті після редіректу).

---

### POST /api/checkout/fulfill

Викликається після успішної оплати (з клієнта або внутрішнього виклику). Body зазвичай містить `session_id`. Читає Stripe Session, оновлює Firestore (credits, purchasedPrompts, orders, purchaseHistory).

---

## Purchase (кредити)

### POST /api/purchase

Покупка промпту(ів) за кредитами. Потрібен **Bearer token** (Firebase ID token).

**Headers:** `Authorization: Bearer <idToken>`

**Body (JSON):**

- Один промпт: `{ promptId: string }`
- Кошик: `{ type: 'cart', promptIds: string[] }`

**Відповідь:** `{ success: true }` або 400/401/500 з `{ error }`.

---

## CRUD (категорії, теги, типи, моделі)

Структура однакова для всіх чотирьох ресурсів.

- **GET /api/categories** (аналогічно tags, types, models) — список документів.
- **POST /api/categories** — створення (body: поля документу). Захист — перевірка admin на бекенді (як реалізовано).
- **GET /api/categories/[id]** — один документ.
- **PATCH /api/categories/[id]** — оновлення.
- **DELETE /api/categories/[id]** — видалення.

Адмін-доступ має бути обмежений роллю на сервері (реалізація в відповідних route handlers).

---

## Search bar backgrounds

- **GET /api/search-bar-backgrounds** — список.
- **POST /api/search-bar-backgrounds** — створення.
- **GET/PATCH/DELETE /api/search-bar-backgrounds/[id]** — один ресурс.
- **POST /api/search-bar-backgrounds/upload** — завантаження файлу (multipart/form-data або як реалізовано).

---

## Клієнтські дані (без REST API)

Багато даних клієнт читає напряму з Firestore через Firebase SDK (промпти, профілі, коментарі, кошик тощо). Список колекцій і правил — у [04-database.md](04-database.md) та [05-auth-security.md](05-auth-security.md).

Деталі компонентів та сторінок: [07-components.md](07-components.md).
