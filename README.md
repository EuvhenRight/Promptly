# Promptly

Маркетплейс AI-промптів: пошук, покупка та продаж промптів.

## Stack

- Next.js 15
- Firebase (Auth, Firestore, Storage)
- Stripe (оплата)
- Vercel / Firebase App Hosting

## Як запустити

```bash
npm i
npm run dev
```

Додатково: скопіюй `.env.example` у `.env.local` і заповни змінні (Firebase, Stripe). Детально — у [docs/09-env.md](docs/09-env.md).

## Документація

- **Інтерактивна документація (типу GitBook)** — у додатку: **[/docs](/docs)** (сайдбар, навігація, рендер Markdown і діаграм Mermaid).
- **API (Swagger)** — **[/docs/api-spec](/docs/api-spec)** (OpenAPI 3.0 + Swagger UI).
- Сирцеві файли та повна технічна документація — у папці **[docs/](docs/)**.
