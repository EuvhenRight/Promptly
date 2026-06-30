# Змінні середовища

## Клієнт (NEXT_PUBLIC_*)

Доступні в браузері; потрібні для Firebase SDK та Stripe на клієнті.

| Змінна | Опис |
|--------|------|
| NEXT_PUBLIC_FIREBASE_API_KEY | Firebase Web API Key. |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | Auth domain (наприклад, *.firebaseapp.com). |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | ID проекту Firebase. **Use only the Promptly project** (Firestore must be enabled for this project). |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | Bucket Storage (наприклад, *.appspot.com або *.firebasestorage.app). |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Sender ID для Messaging. |
| NEXT_PUBLIC_FIREBASE_APP_ID | Web App ID. |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe publishable key (pk_test_... / pk_live_...). |

Для Firebase на клієнті також може використовуватися один JSON **FIREBASE_WEBAPP_CONFIG** або **FIREBASE_CONFIG** (на сервері/білді) — див. `src/firebase/config.ts`.

## Сервер (секрети, тільки на бекенді)

Не мають префіксу NEXT_PUBLIC_; не потрібно їх виставляти для статичного білду клієнта.

| Змінна | Опис |
|--------|------|
| STRIPE_SECRET_KEY | Секретний ключ Stripe (sk_test_... / sk_live_...). |
| STRIPE_CURRENCY | Валюта (наприклад, eur, usd). |
| REPLICATE_API_TOKEN | Ваш API токен з Replicate.com для AI-функцій. |
| Firebase Admin | Зазвичай через сервісний акаунт (файл ключа або default credentials у GCP). У App Hosting — через Secret Manager та конфіг. |

## Локальна розробка

1. Скопіювати `.env.example` у `.env.local`.
2. Заповнити Firebase config **тільки з проекту Promptly** (Firebase Console → вибрати проект Promptly → Project settings → Your apps). Використовуйте `service-account.json` з цього ж проекту (Service accounts → Generate new private key).
3. Додати Stripe keys та `REPLICATE_API_TOKEN`.
4. Для повного checkout/fulfill/purchase локально потрібен Firebase Admin (credentials) та Stripe secret.

## Примітки

- `.env` та `.env.local` не комітяться (мають бути в .gitignore).
- У `apphosting.yaml` можуть бути захардкоджені тільки публічні/несекретні значення; секрети — посилання на Secret Manager.
- Домен для Stripe return URL: `DOMAIN` або `VERCEL_URL` (автоматично на Vercel).
