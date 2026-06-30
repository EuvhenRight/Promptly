# Деплой

## Платформи

- **Vercel** — класичний варіант для Next.js (підключення репо, env змінні, автоматичні деплої).
- **Firebase App Hosting** — конфігурація в `apphosting.yaml`; використовується для деплою Next.js з інтеграцією Firebase (в т.ч. секрети через Google Secret Manager).

## apphosting.yaml

- **runConfig.maxInstances** — ліміт інстансів (наприклад, 1).
- **env** — змінні середовища (BUILD/RUNTIME), наприклад `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_CURRENCY`. Секрети (Stripe secret, Firebase Admin тощо) звертаються через Secret Manager; доступ для сервісних акаунтів App Hosting/Cloud Build потрібно видати вручну в Google Cloud Console.

## Змінні середовища

- Публічні (NEXT_PUBLIC_*), Stripe publishable key — можна в apphosting env або Vercel.
- Секрети (STRIPE_SECRET_KEY, Firebase Admin SDK, API keys) — тільки на сервері (Vercel Env / Secret Manager), ніколи не в клієнті. Деталі змінних: [09-env.md](09-env.md).

## Build

- `npm run build` — production build (Next.js).
- `engines.node` у package.json — `>=20.0.0`.
- Порт dev: `9002` (`npm run dev -- -p 9002` або скрипт `dev` з turbopack).

## Firebase

- Правила Firestore та Storage деплояться окремо: `firebase deploy --only firestore:rules` та `firebase deploy --only storage`.
- Індекси Firestore описані в `firestore.indexes.json` і створюються/оновлюються при деплої Firestore.

## Рекомендації

- Після додавання нових секретів у App Hosting — видати права Secret Manager Secret Accessor сервісним акаунтам (з документації Firebase App Hosting).
- Для production встановити коректний `DOMAIN` (або VERCEL_URL), щоб Stripe return URL формувався правильно.

Список змінних середовища: [09-env.md](09-env.md).
