# Backend

## Загальне

Backend складається з:

- **Next.js API Routes** (`src/app/api/`) — HTTP endpoints.
- **Server Actions** — окремі файли з `'use server'` (наприклад, `admin/prompts/actions.ts`, AI flow, `admin/payouts/actions.ts`).
- **Firebase Admin SDK** — тільки на сервері (ініціалізація в `src/firebase/admin.ts`), для Firestore та верифікації ID token.

Middleware у проєкті **немає** (немає `middleware.ts`).

## API Routes (огляд)

| Метод | Шлях | Призначення |
|-------|------|-------------|
| GET/POST | `/api/categories` | Список/створення категорій. |
| GET/PATCH/DELETE | `/api/categories/[id]` | Один ресурс. |
| GET/POST | `/api/tags` | Теги. |
| GET/PATCH/DELETE | `/api/tags/[id]` | Один тег. |
| GET/POST | `/api/types` | Типи контенту. |
| GET/PATCH/DELETE | `/api/types/[id]` | Один тип. |
| GET/POST | `/api/models` | Моделі AI. |
| GET/PATCH/DELETE | `/api/models/[id]` | Одна модель. |
| POST | `/api/checkout` | Створення Stripe Checkout Session (prompt/cart/credits/plan). |
| GET | `/api/checkout/session-status` | Статус сесії Stripe. |
| POST | `/api/checkout/fulfill` | Після успішної оплати — оновлення Firestore (credits, purchasedPrompts, orders, purchaseHistory, sales). |
| POST | `/api/purchase` | Покупка за кредити (один промпт або кошик); вимагає Bearer token (Firebase ID token). |
| GET/POST | `/api/search-bar-backgrounds` | CRUD фонів пошуку. |
| GET/PATCH/DELETE | `/api/search-bar-backgrounds/[id]` | Один фон. |
| POST | `/api/search-bar-backgrounds/upload` | Завантаження файлу фону. |
| GET | `/api/admin/sales` | Отримання статистики продажів для адмін-панелі. |

Детальний опис параметрів та тіл — у [06-api.md](06-api.md).

## Server Actions

- **`src/app/admin/prompts/actions.ts`** — дії адмінки для промптів (скрапінг).
- **`src/app/admin/payouts/actions.ts`** — дії адмінки для виплат (зміна статусу).
- **`src/ai/flows/suggest-relevant-tags.ts`** — Genkit flow для AI-підказки тегів; може викликатися з сервера.

## Робота з Firebase на сервері

- **admin.ts** — ініціалізація `firebase-admin` (credentials з env або default), експорт `adminDb` (Firestore). Якщо Admin SDK не сконфігуровано (наприклад, локально без ключа), `adminDb` може бути `null` — це враховано в checkout/purchase.
- **Верифікація користувача** — у захищених API (наприклад, `/api/purchase`) використовується `Authorization: Bearer <idToken>`, далі `getAdminAuth().verifyIdToken(token)`.
- **Адмін** — перевірка ролі через читання `users/{uid}.role === 'admin'` (у Firestore rules та при потребі на бекенді).

## Stripe

- **Checkout** — створюється Session з `mode: 'payment'`, `ui_mode: 'embedded'`. Після оплати клієнт редіректиться на `/checkout/return?session_id=...`, потім клієнт/сервер викликає fulfill, де по `session_id` отримується Session і оновлюється Firestore.
- **Мінімум** — 0.50 у валюті (наприклад, EUR). Кредити та підписки описані в checkout route (PLAN_PRICES, CREDITS_PRICES).

## Скрапер (адмін)

- Логіка скрапінгу для імпорту промптів знаходиться в `admin/prompts/actions.ts` і викликається з компонента `admin/prompts/scraper.tsx`. Вона викликає потрібні API або Server Actions для збереження в Firestore.

Деталі безпеки та правил доступу: [05-auth-security.md](05-auth-security.md). Схема БД: [04-database.md](04-database.md).
