# Авторизація та безпека

## Авторизація (Firebase Auth)

- **Провайдер**: лише **Google** (popup) — `signInWithGoogle()` у `src/firebase/auth.ts`.
- Клієнт: `onAuthStateChanged` у провайдері; після логіну створюється/оновлюється документ `users/{uid}` та `public-profiles/{uid}` (через клієнт або backend залежно від реалізації).
- Для захищених API (наприклад, purchase) клієнт передає **Firebase ID token** у заголовку: `Authorization: Bearer <idToken>`. Сервер перевіряє його через `firebase-admin/auth` `verifyIdToken()`.

## Ролі

- **user** — звичайний користувач (перегляд, покупки, профіль, коментарі після покупки).
- **admin** — повний доступ до адмін-панелі, Firestore (створення/редагування/видалення промптів, категорій, тегів, типів, моделей, користувачів, коментарів, фонів, scraped_prompts, виплат, продажів). Роль зберігається в `users/{uid}.role`; у правилах Firestore використовується `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'`.

## Firestore Rules (коротко)

- **users** — get/update лише власник або admin; обмежені поля для оновлення (не можна змінювати role, credits, earnings, purchasedPrompts з клієнта).
- **public-profiles** — read всі; create власник; update власник (без зміни лічильників) або будь-який залогінений користувач (для лічильників `views`, `followers`, `following`).
- **prompts** — read всі (публічні); create/delete admin; update — admin або лише зміна stats.views (+1), stats.likes (+1/-1), rating (купивші).
- **prompts/private/content** — read admin або купивші; write admin.
- **prompts/comments** — create якщо купив або безкоштовний промпт; update/delete автор або admin.
- **carts, purchaseHistory** — лише власник (запис purchaseHistory тільки з бекенду).
- **notifications** — read лише власник; write тільки з бекенду.
- **sales, payouts** — read/write тільки admin (або створення payout користувачем).
- **categories, tags, types, models** — read всі; write admin.
- **searchBarBackgrounds** — read всі; write admin.
- **scraped_prompts** — read/write admin.

Повний текст правил: `firestore.rules` у корені проекту.

## Storage Rules (коротко)

- **prompts/** — read всі; write авторизовані (створення промптів далі контролюється Firestore/адмінкою).
- **users/{userId}/avatar**, **users/{userId}/cover** — read всі; write лише власник.
- **searchBarBackgrounds/** — read всі; write авторизовані (адмін-функціонал зазвичай обмежений адмін-роллю на бекенді).

Повний текст: `storage.rules` у корені проекту.

## Вразливості та рекомендації

- **Секрети** — Stripe secret, Firebase Admin key, API keys не повинні потрапляти в клієнт; лише в env на сервері та в безпечних змінних (наприклад, Secret Manager для App Hosting).
- **ID token** — передавати тільки по HTTPS; не зберігати в localStorage у відкритому вигляді (Firebase SDK сам керує сесією).
- **Адмін** — перевірка ролі на сервері для всіх адмін-API та Server Actions; не покладатися лише на приховування UI.
- **Rate limiting** — у поточному описі не реалізовано; для публічних API (checkout, purchase) варто розглянути обмеження запитів.

Деталі API та заголовків: [06-api.md](06-api.md).
