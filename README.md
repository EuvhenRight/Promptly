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

I designed and built the platform end-to-end — from the public marketplace and authenticated dashboards to the admin moderation panel, Stripe-powered payments, creator payouts, and AI generation flows. The codebase is production-grade: typed end-to-end, tested at four levels (unit / integration / contract / e2e), documented in-app, and deployable to both Firebase App Hosting and Netlify.

## Highlights

- **Production-grade Next.js 15 App Router** — RSC, server actions, route handlers, and a custom Firebase Storage image loader for optimized thumbnails.
- **Stripe end-to-end** — Checkout, idempotent webhook fulfilment, subscription plans, and creator payouts via Stripe Connect with admin approval.
- **Type-safe boundaries** — Zod schemas shared between forms and API handlers; one source of truth from input validation to Firestore writes.
- **Pluggable AI layer** — Google Genkit flows wrap Gemini and Replicate, so swapping providers is a one-file change.
- **Four-layer test pyramid** — unit ([Vitest](https://vitest.dev/)), integration, contract, and end-to-end ([Playwright](https://playwright.dev/)).
- **Firestore schema designed for read patterns** — composite indexes and security rules tuned for the marketplace's hottest queries.
- **In-app documentation** — Markdown + Mermaid diagrams + Swagger UI for the OpenAPI 3.0 spec.
- **Multi-target deploy** — same build runs on Firebase App Hosting and Netlify with no code changes.

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

## Engineering Decisions

### Firestore schema designed for the read patterns

Promptly's hottest paths are "feed with N filters + sort" and "prompt detail + comments." The document layout, composite indexes ([firestore.indexes.json](firestore.indexes.json)), and security rules ([firestore.rules](firestore.rules)) are tuned to make these reads cheap without server-side aggregation jobs.

### Type-safe boundaries everywhere

- All API route handlers under [src/app/api/](src/app/api/) validate input with Zod.
- Forms reuse the same Zod schemas, so client and server share one source of truth.
- Domain types live in [src/lib/types.ts](src/lib/types.ts) and are imported by both Firestore helpers and React components.

### Stripe integration, end to end

- Checkout session creation under [src/app/api/checkout/](src/app/api/checkout/).
- Idempotent webhook fulfilment with status reconciliation.
- Subscription plans backed by a Stripe → Firebase sync script ([scripts/sync-stripe-to-firebase.js](scripts/sync-stripe-to-firebase.js)).
- Creator payouts via Stripe Connect, with admin approval gating.

### AI flows isolated behind Genkit

[src/ai/flows/](src/ai/flows/) defines `generate-image-flow`, `generate-video-flow`, and `suggest-relevant-tags` as Genkit functions. The rest of the app calls them like any other server action, so swapping the underlying model (Gemini ↔ Replicate ↔ future providers) is a one-file change.

### Image pipeline

Originals upload to `prompts/`, the Firebase "Resize Images" extension produces `_400/_800/_1200` variants in `prompts/thumbnails/`, and a custom Next/Image loader (`firebaseImageLoader` in [src/lib/utils.ts](src/lib/utils.ts)) rewrites URLs at request time. A component-level `onError` fallback guarantees the original loads even if a thumbnail is missing.

### Multi-target deploy

The same build runs on Firebase App Hosting ([apphosting.yaml](apphosting.yaml)) and Netlify ([netlify.toml](netlify.toml)) with no code changes — useful for switching providers without lock-in.

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

Copy `.env.example` to `.env` and fill in the values from your Firebase and Stripe dashboards. See [docs/09-env.md](docs/09-env.md) for the full variable reference.

```bash
cp .env.example .env
```

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

Four layers, each running independently:

| Layer | Tooling | Lives in |
| --- | --- | --- |
| Unit | Vitest + Testing Library | `tests/unit` |
| Integration (API route handlers) | Vitest | `tests/integration` |
| Contract (request/response shapes) | Vitest | `tests/contracts` |
| End-to-end (browser flows) | Playwright | `tests/e2e` |

E2E covers the golden paths: home → filter → prompt → cart → checkout, plus auth redirect, community feed, plan upgrades, and docs navigation.

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

## What I'm Most Proud Of

- **Full-stack ownership** — schema, API, UI, payments, admin, infrastructure, and documentation.
- **Type-safety from form input to Firestore document** — Zod schemas reused on both sides of the wire mean bugs are caught at compile time, not in production.
- **Pluggable AI layer** — model providers are an implementation detail, not an architecture decision.
- **An admin panel that's actually usable** — every domain entity is editable without writing one-off scripts.

## What I'd Do Differently Next Time

- Move heavier server logic to Firebase Cloud Functions instead of Next.js route handlers, to decouple cost and scaling.
- Introduce a feature-flag layer earlier — late-stage A/B tests around plan pricing required code edits I'd rather have done as config.
- Add an event-bus pattern (Pub/Sub or similar) between Stripe webhooks and downstream side-effects, so payment, fulfilment, and notification can be observed and retried independently.

## Contributing

Issues and pull requests are welcome. Before opening a PR:

1. Run `npm run typecheck` and `npm run lint`
2. Run the relevant test suites
3. Follow the conventions documented in [RULES.md](RULES.md)

## License

Proprietary — all rights reserved.

## Author

Built and maintained by [@EuvhenRight](https://github.com/EuvhenRight).
