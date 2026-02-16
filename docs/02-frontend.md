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
| `/user/[username]` | Публічний профіль користувача. |
| `/account` | Кабінет користувача (редагування профілю). |
| `/account/profile` | Статистика та активність користувача. |
| `/account/plans` | Керування підписками та покупка кредитів. |
| `/account/wallet` | Гаманець, баланс та запити на виплату. |
| `/account/notifications` | Сповіщення. |
| `/cart` | Кошик. |
| `/checkout`, `/checkout/return` | Stripe Checkout та сторінка після оплати. |
| `/submit` | Подача промпту. |
| `/community` | Спільнота (фід, топ-креатори, стріки тощо). |
| `/admin` | Дашборд адмін-панелі. |
| `/admin/prompts` | Керування промптами, скрапер. |
| `/admin/sales` | Аналітика продажів. |
| `/admin/comments` | Керування коментарями. |
| `/admin/categories`, `/admin/tags`, `/admin/types`, `/admin/models` | Керування довідниками. |
| `/admin/search-bar-backgrounds` | Керування фонами пошуку. |
| `/admin/users` | Керування користувачами. |
| `/admin/payouts` | Керування запитами на виплату. |

Layout: кореневий `layout.tsx` обгортає додаток у ThemeProvider, FirebaseClientProvider, провайдери категорій/тегів/типів/моделей; окремий `admin/layout.tsx` для адмін-розділу.

## Layouts

- **Root layout** (`src/app/layout.tsx`) — HTML, body, ThemeProvider, FirebaseClientProvider, CategoriesProvider, TagsProvider, TypesProvider, ModelsProvider, Toaster.
- **Admin layout** (`src/app/admin/layout.tsx`) — обгортка для сторінок адмінки з сайдбаром.
- **Account layout** — реалізовано через компонент `AccountSidebar` на кожній сторінці кабінету.

## Компоненти (структура)

- **layout/** — header, footer (глобальна навігація, auth, тема).
- **ui/** — shadcn (button, card, input, dialog, table, tabs, toast тощо).
- **home/** — hero, search-bar, filter-sidebar, prompt-feed, prompt-card, sub-header, top-creators-widget, mobile-filters.
- **prompt/** — add-comment-form, comment-list.
- **community/** — community-hero, community-feed, віджети.
- **account/** — account-sidebar, theme-switcher.
- **admin/** — специфічні для адмінки компоненти (таблиці, форми).
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
