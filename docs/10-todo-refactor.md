# TODO та ідеї для рефакторингу

## Документація та консистентність

- [ ] Привести назву в `docs/blueprint.md` (PromptVerse) до фактичної (Promptly) або винести в глосарій як історичну.
- [ ] Синхронізувати `docs/backend.json` з актуальною Firestore-структурою (наприклад, purchaseHistory, subcollections) та з `src/lib/types.ts`.
- [ ] Додати приклади запитів (curl/ fetch) для основних API в `06-api.md` або окремому файлі.

## Безпека та надійність

- [ ] Додати перевірку ролі admin на сервері для всіх адмін API (categories, tags, types, models, search-bar-backgrounds) — якщо десь поки що немає.
- [ ] Розглянути rate limiting для `/api/checkout` та `/api/purchase`.
- [ ] Переконатися, що в production не використовуються тестові ключі Stripe/Firebase; винести перевірку env у старт або health-check.

## Головна сторінка (src/app/page.tsx)

- [ ] Створити компонент `GoogleSignInButton` (`components/auth/google-sign-in-button.tsx`) — іконка та кнопка дублюються в page, header, cart, plans, user-menu.
- [ ] Винести `AuthModal` у окремий файл `components/auth/auth-modal.tsx`.
- [ ] Винести `FeedSkeleton` у `components/home/feed-skeleton.tsx`.
- [ ] Створити хук `useFeedFilters` — об’єднати логіку фільтрів (activeFilter, selectedTypeId, categoryId, tagId, modelId, sortBy, searchTerm, showPrivateOnly) та хендлери (handleFilterChange, handleSortChange, handleSearch).
- [ ] Створити хук `useInfiniteScrollWithPaywall` — розділити логіку IntersectionObserver + paywall від основного компонента.
- [ ] Перенести `mainLinks` у `lib/constants.ts` або `config/home.ts`.
- [ ] Спростити умову показу Footer: `(!shouldShowPaywall || (shouldShowPaywall && !isAuthModalOpen))` → `!isAuthModalOpen`.
- [ ] Після рефакторингу `page.tsx` має бути ~80–120 рядків (композиція компонентів).

## Архітектура та код

- [ ] Видалити `'use server'` з `src/app/api/purchase/route.ts` якщо він там лишився помилково (API routes вже виконуються на сервері).
- [ ] Розглянути винесення констант цін (PLAN_PRICES, CREDITS_PRICES, MIN_AMOUNT_CENTS) у конфіг або env для легшої зміни без правки коду.
- [ ] Уніфікувати обробку помилок у API (формат відповіді, коди, логування).

## Продуктові та UX

- [ ] Переглянути мобільну версію фільтрів та стрічки (mobile-filters, prompt-feed).
- [ ] Додати індекси Firestore для всіх складних запитів і задокументувати їх у `firestore.indexes.json` та в `04-database.md` при появі нових запитів.

## Деплой та DevOps

- [ ] Описати в `08-deployment.md` кроки для першого деплою на Vercel і на Firebase App Hosting (включно з секретами).
- [ ] Додати перевірку наявності обов’язкових env під час збірки або старту (наприклад, для production).

---

*Цей файл оновлювати в міру закриття задач та нових ідей. Можна використовувати як основу для backlog.*
