# Golden Rules for Firebase SDKs

- **Server-side (API Routes, Server Actions):** Use **Admin SDK**.
  - Document snapshots use `.exists` (it's a property).
  - Use `adminDb` for database access.

- **Client-side (React Components):** Use **Client SDK**.
  - Document snapshots use `.exists()` (it's a method).