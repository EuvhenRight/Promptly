# Promptly

A modern marketplace for buying, selling, and discovering AI prompts. Built with Next.js 15, Firebase, and Stripe.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Stripe](https://img.shields.io/badge/Stripe-20-635BFF?logo=stripe)](https://stripe.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## Overview

Promptly is a full-stack marketplace where creators publish AI prompts (for ChatGPT, Gemini, Midjourney, and more) and users can browse, purchase, and run them. The platform handles authentication, payments, content moderation, ratings, comments, and creator payouts end-to-end.

## Features

- **Prompt marketplace** — browse, search, filter by category, model, type, tags, price, and rating
- **AI generation** — preview generations via Google Genkit / Gemini integration
- **Authentication** — Google OAuth and email/password via Firebase Auth
- **Stripe payments** — one-off purchases, subscription plans, automatic creator payouts
- **PRO plans** — premium access to private prompts and creator analytics
- **Reviews & ratings** — purchasers can rate and comment
- **Community feed** — follow creators, like prompts, get notifications
- **Admin panel** — moderate prompts, manage categories/tags/models, approve payouts
- **Creator dashboard** — sales analytics, earnings, payout requests
- **In-app documentation** — Markdown + Mermaid rendering, Swagger UI for API spec
- **Internationalization-ready** — Ukrainian and English content support

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 15](https://nextjs.org/) (App Router, RSC) |
| UI | [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [shadcn/ui](https://ui.shadcn.com/) |
| Language | [TypeScript 5.5](https://www.typescriptlang.org/) |
| Auth & DB | [Firebase Auth](https://firebase.google.com/docs/auth), [Cloud Firestore](https://firebase.google.com/docs/firestore), [Cloud Storage](https://firebase.google.com/docs/storage) |
| Payments | [Stripe](https://stripe.com/) (Checkout, Webhooks, Subscriptions) |
| AI | [Google Genkit](https://firebase.google.com/docs/genkit), [Gemini](https://ai.google.dev/), [Replicate](https://replicate.com/) |
| Forms & Validation | [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) |
| Tables & Charts | [TanStack Table](https://tanstack.com/table), [Recharts](https://recharts.org/) |
| Testing | [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/), [Testing Library](https://testing-library.com/) |
| Hosting | [Firebase App Hosting](https://firebase.google.com/docs/app-hosting), [Netlify](https://www.netlify.com/) |

## Getting Started

### Prerequisites

- Node.js `>=20.0.0`
- A Firebase project (Firestore, Auth, Storage enabled)
- A Stripe account (test mode is fine)

### Installation

```bash
git clone https://github.com/EuvhenRight/Promptly.git
cd Promptly
npm install
```

### Environment

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server) — optional, used as fallback to service-account.json
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_CURRENCY=eur
```

See [docs/09-env.md](docs/09-env.md) for a complete reference.

### Run

```bash
npm run dev          # start dev server on http://localhost:9002
npm run build        # production build
npm run start        # serve production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint
```

### Genkit (AI flows)

```bash
npm run genkit:dev     # run Genkit flows once
npm run genkit:watch   # watch mode
```

## Testing

```bash
npm run test              # vitest watch mode
npm run test:run          # vitest single run
npm run test:unit         # unit tests
npm run test:integration  # integration tests
npm run test:contracts    # contract tests
npm run test:e2e          # Playwright end-to-end
npm run test:e2e:ui       # Playwright UI mode
```

## Project Structure

```text
.
├── docs/                    # technical docs, architecture, strategy
├── public/                  # static assets
├── scripts/                 # ops scripts (Stripe sync, etc.)
├── src/
│   ├── ai/                  # Genkit flows & AI integrations
│   ├── app/                 # Next.js App Router routes
│   │   ├── admin/           # admin panel
│   │   ├── api/             # API route handlers
│   │   ├── community/       # social feed
│   │   ├── docs/            # in-app documentation
│   │   ├── prompt/          # prompt detail pages
│   │   └── ...
│   ├── components/          # UI components (organized by domain)
│   ├── firebase/            # Firebase client setup, hooks, helpers
│   ├── hooks/               # React hooks
│   └── lib/                 # shared utilities, types, schemas
├── tests/                   # unit, integration, contract, e2e
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore composite indexes
├── storage.rules            # Cloud Storage security rules
├── firebase.json            # Firebase project config
├── apphosting.yaml          # Firebase App Hosting config
└── next.config.js           # Next.js config
```

## Deployment

### Firebase App Hosting

Configuration is in [apphosting.yaml](apphosting.yaml). Set runtime secrets in Google Cloud Secret Manager and grant the App Hosting service account the `Secret Manager Secret Accessor` role.

### Netlify

Configuration is in [netlify.toml](netlify.toml). Set environment variables in the Netlify dashboard.

### Deploy Firestore rules and indexes

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

## Documentation

In-depth documentation lives in [docs/](docs/) and is also rendered inside the app:

- **[/docs](http://localhost:9002/docs)** — interactive documentation (GitBook-style)
- **[/docs/api-spec](http://localhost:9002/docs/api-spec)** — OpenAPI 3.0 / Swagger UI

Key documents:

- [Overview](docs/00-overview.md)
- [Architecture](docs/01-architecture.md)
- [Frontend](docs/02-frontend.md)
- [Backend](docs/03-backend.md)
- [Database schema](docs/04-database.md)
- [Auth & security](docs/05-auth-security.md)
- [API reference](docs/06-api.md)
- [Components](docs/07-components.md)
- [Deployment](docs/08-deployment.md)
- [Environment variables](docs/09-env.md)
- [Testing](docs/12-testing.md)
- [2026 strategy](docs/13-strategy-2026.md)

## Contributing

Issues and pull requests are welcome. Before opening a PR:

1. Run `npm run typecheck` and `npm run lint`
2. Run the relevant test suites
3. Follow the conventions documented in [RULES.md](RULES.md)

## License

Proprietary — all rights reserved.

## Author

Built and maintained by [@EuvhenRight](https://github.com/EuvhenRight).
