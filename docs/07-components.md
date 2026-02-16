# Компоненти

## Структура каталогів

```
src/components/
├── layout/          # Глобальний layout
├── ui/              # shadcn/ui примітиви
├── home/            # Головна сторінка
├── prompt/          # Сторінка промпту
├── community/       # Сторінка спільноти
├── account/         # Кабінет користувача
├── admin/           # Специфічні для адмінки компоненти
└── інші (theme-provider, stripe-checkout, FirebaseErrorListener)
```

## layout/

- **header.tsx** — шапка: лого, навігація, пошук, auth (вхід/аватар + меню), перемикач теми.
- **footer.tsx** — підвал сайту.

## ui/ (shadcn/ui)

Пресет компонентів на базі Radix: button, card, input, label, textarea, dialog, dropdown-menu, select, tabs, table, toast, toaster, avatar, badge, skeleton, accordion, alert, calendar, carousel, chart, checkbox, collapsible, form, menubar, pagination, popover, progress, radio-group, scroll-area, separator, sheet, slider, switch, tooltip тощо.

## home/

- **hero.tsx** — блок-герой на головній.
- **search-bar.tsx** — поле пошуку (з фонами з searchBarBackgrounds).
- **filter-sidebar.tsx** — фільтри (категорія, модель, тип, ціна).
- **mobile-filters.tsx** — мобільна версія фільтрів.
- **prompt-feed.tsx** — стрічка/сітка промптів.
- **prompt-card.tsx** — картка промпту в стрічці.
- **sub-header.tsx** — підшапка головної з фільтрами.
- **top-creators-widget.tsx** — віджет топ-креаторів.

## prompt/

- **add-comment-form.tsx** — форма додавання коментаря (з рейтингом для купивших).
- **comment-list.tsx** — список коментарів під промптом.

## community/

- **community-hero.tsx**, **community-feed.tsx** — герой та стрічка спільноти.
- **SubmitPromptCta.tsx** — віджет із закликом створити промпт.

## account/

- **account-sidebar.tsx** — сайдбар кабінету (меню: профіль, плани, гаманець, сповіщення).
- **theme-switcher.tsx** — перемикач світлої/темної теми.

## admin/

- Специфічні компоненти для кожної сторінки адмінки знаходяться в `src/app/admin/`, наприклад, `prompts/prompts-table.tsx`, `payouts/payouts-table.tsx`. Вони використовують ті самі `ui/` компоненти.

## Інші

- **theme-provider.tsx** — обгортка next-themes для теми.
- **stripe-checkout.tsx** — інтеграція Stripe Embedded Checkout.
- **FirebaseErrorListener.tsx** — глобальний обробник помилок Firebase (наприклад, показ toast).

## Провайдери та контексти

- **FirebaseClientProvider** — ініціалізація Firebase на клієнті, обгортка додатку.
- **CategoriesProvider, TagsProvider, TypesProvider, ModelsProvider** — контексти з кешем довідникових даних з Firestore (з `src/hooks/use-categories` тощо).
