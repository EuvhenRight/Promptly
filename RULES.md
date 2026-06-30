# Golden Rules for Firebase

This document outlines the core principles for interacting with Firebase in this project to maintain security and performance.

## 1. Client SDK (Client Components - `firebase`)

Used in React components (`'use client'`).

- **Responsibility:** Primarily for **reading public data** and **writing to the current user's own data**.
- **Authentication:** Identifies the user via `onAuthStateChanged`. The `request.auth` object in security rules is automatically populated.
- **Data Access:** All access is subject to `firestore.rules`.
- **Golden Rule:** **NEVER TRUST THE CLIENT.** The client can be manipulated. Do not perform sensitive operations from the client.
- **Example:** A user updating their own display name, or liking a prompt (which updates their own `favoritePrompts` array and a public counter on the prompt).

### Syntax Note:
- Document snapshots use the `.exists()` method: `if (docSnap.exists()) { ... }`

## 2. Admin SDK (Server-Side Code - `firebase-admin`)

Used in Next.js API Routes and Server Actions.

- **Responsibility:** For all **privileged operations**, such as:
    - Processing payments and granting permissions.
    - Writing to another user's documents (e.g., sending a notification).
    - Complex data validation that cannot be done in security rules.
    - Accessing data that should be hidden from all clients (e.g., admin-only collections).
- **Authentication:** Verifies a user's identity by decoding an ID token sent from the client: `admin.auth().verifyIdToken(token)`.
- **Data Access:** **Bypasses all security rules.** This is why it must *only* be used on the server.
- **Golden Rule:** Use the Admin SDK for any action that involves money, writing to data the user doesn't own, or complex, multi-step transactions that must be atomic.
- **Example:** Fulfilling an order after a Stripe payment, creating a notification for a seller when their prompt is sold.

### Syntax Note:
- Document snapshots use the `.exists` property: `if (docSnap.exists) { ... }`
