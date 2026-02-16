# База даних (Firestore)

## Огляд

Уся основна дані зберігаються в **Firestore**. Схема та типи також описані в `src/lib/types.ts` та `docs/backend.json`.

## Колекції та субколекції

### users/{userId}

- Профіль користувача (приватні та адмін-поля): email, displayName, photoURL, username, role, credits, earnings, payoutStatus, purchasedPrompts, favoritePrompts, followers, following, views, coverImageURL, description, headline, соцмережі, план підписки (planId, planPurchasedAt тощо).
- **Правила**: read/write лише власник або admin; окремі обмеження на оновлення (наприклад, не можна змінювати role, credits, earnings, purchasedPrompts з клієнта).
- Субколекції:
  - **carts/{cartId}** — кошик (promptIds, createdAt, updatedAt). Доступ лише власнику.
  - **purchaseHistory/{docId}** — історія покупок (credits, prompt, cart, plan). Тільки читання власником; запис лише з бекенду.
  - **followers/{followerId}**, **following/{followingId}** — списки підписників та підписок.
  - **notifications/{notificationId}** — сповіщення для користувача.

### public-profiles/{userId}

- Публічні поля профілю (uid, username, displayName, photoURL, coverImageURL, description, followers, following, views, соцмережі, planId). Оновлення лічильників обмежені правилами (лише +1/-1).

### prompts/{promptId}

- Поля: authorId, title, titleLowercase, searchTerms, description, price, images[], rating (average, count), tags[], categoryId, typeId, modelId, stats (views, sales, likes), createdAt, updatedAt. Публічне читання; створення/видалення — admin; оновлення — admin або обмежені зміни (stats.views, stats.likes, rating для купивших).
- Субколекції:
  - **private/{docId}** — документ з id `content` містить захищений текст промпту (PromptPrivateContent). Читання — admin або купивші; запис — admin.
  - **comments/{commentId}** — коментарі (userId, text, rating, timestamp). Створення — якщо купив або безкоштовний промпт; редагування/видалення — автор або admin.

### sales/{saleId}

- Записи про всі транзакції на платформі (покупки промптів, кредитів, підписок). Використовується для аналітики. Запис тільки з бекенду.

### payouts/{payoutId}

- Запити користувачів на виплату зароблених кредитів. Доступ на читання та зміну статусу — лише для адмінів.

### Довідникові колекції (публічне читання, запис — admin)

- **categories/{categoryId}**
- **tags/{tagId}**
- **types/{typeId}**
- **models/{modelId}**

### Інше

- **searchBarBackgrounds/{bgId}** — фони для пошукового бару; read — всі, write — admin.
- **scraped_prompts/{sourceId}** — дані скрапера; read/write лише admin.

## Індекси

- Використовуються складні запити (наприклад, по prompts з фільтрами). Потрібні індекси описані в `firestore.indexes.json`; при помилках "index required" треба додати відповідний індекс через консоль або файл.

## Типи (TypeScript)

- Основні типи: `UserProfile`, `PublicProfile`, `Prompt`, `PromptPrivateContent`, `PromptComment`, `Cart`, `PurchaseHistoryRecord`, `SaleRecord`, `PayoutRequest`, `Notification` — у `src/lib/types.ts`.

Правила безпеки та обмеження оновлень: [05-auth-security.md](05-auth-security.md). API для читання/запису: [06-api.md](06-api.md).
