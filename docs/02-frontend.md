# Frontend

## Загальне

- **Next.js 15** з App Router, **React 19**.
- **Tailwind CSS** + **shadcn/ui** (Radix) у `src/components/ui/`.
- Шрифти: Inter (body), Space Grotesk (headlines) — підключені в `src/app/layout.tsx`.

## Маршрутизація (App Router)

Усі маршрути в `src/app/`:

| Шлях | Опис |
|------|------|
| `/` | Головна — стрічка промптів, фільтри, hero, search bar. |
| `/prompt/[id]` | Сторінка одного промпту (контент, коментарі, кнопка купівлі). |
| `/profile`, `/profile/[username]` | Профіль поточного / іншого користувача. |
| `/user/[username]` | Публічний профіль за username (альтернативний шлях). |
| `/account`, `/account/profile`, `/account/plans`, `/account/notifications` | Кабінет користувача. |
| `/cart` | Кошик. |
| `/checkout`, `/checkout/return` | Stripe Checkout та сторінка після оплати. |
| `/submit` | Подача промпту (орієнтовано на авторизованих). |
| `/community` | Спільнота (фід, топ-креатори, стріки тощо). |
| `/notifications` | Сповіщення. |
| `/admin/*` | Адмін: промпти, категорії, теги, типи, моделі, користувачі, коментарі, search-bar backgrounds. |

Layout: кореневий `layout.tsx` обгортає додаток у ThemeProvider, FirebaseClientProvider, провайдери категорій/тегів/типів/моделей; окремий `admin/layout.tsx` для адмін-розділу.

## Layouts

- **Root layout** (`src/app/layout.tsx`) — HTML, body, ThemeProvider, FirebaseClientProvider, CategoriesProvider, TagsProvider, TypesProvider, ModelsProvider, Toaster.
- **Admin layout** (`src/app/admin/layout.tsx`) — обгортка для сторінок адмінки (sidebar/навігація залежить від реалізації).

## Компоненти (структура)

- **layout/** — header, footer (глобальна навігація, auth, тема).
- **ui/** — shadcn (button, card, input, dialog, table, tabs, toast тощо).
- **home/** — hero, search-bar, filter-sidebar, prompt-feed, prompt-card, sub-header, top-creators-widget, mobile-filters.
- **prompt/** — add-comment-form, comment-list.
- **community/** — community-hero, community-feed, new-members, member-of-the-day, streaks-section, verified-profiles.
- **account/** — account-sidebar, theme-switcher.
- **FirebaseErrorListener**, **theme-provider**, **stripe-checkout** — глобальні/спеціалізовані.

## Управління станом

- **Серверний стан** — дані з Firestore через хуки та провайдери; частина даних через Server Components.
- **Клієнт** — Firebase Auth (onAuthStateChanged) у провайдері; локальний UI state (форми, модалки) через React state.
- Глобального клієнтського store (Redux/Zustand) немає; контексти — Firebase, Categories, Tags, Types, Models.

## Хуки

- `use-categories`, `use-tags`, `use-types`, `use-models` — завантаження довідникових колекцій з Firestore (кэш у контексті).
- `use-prompts-feed` — стрічка промптів з фільтрами.
- `use-toast` — обгортка над toaster.
- Firebase: `useUser`, `useDoc`, `useCollection` з `src/firebase/`.

## Стилі та теми

- `src/app/globals.css` — глобальні змінні, Tailwind.
- ThemeProvider (`next-themes`) — світла/темна тема, перемикач у header/account.

Повний перелік компонентів і їх призначення: [07-components.md](07-components.md).
