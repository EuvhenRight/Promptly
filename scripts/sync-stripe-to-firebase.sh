#!/usr/bin/env bash
# Sync all Stripe env vars from .env to Firebase (apphosting.yaml + Secret Manager).
# Run from project root: ./scripts/sync-stripe-to-firebase.sh
# Or: node scripts/sync-stripe-to-firebase.js  /  npm run stripe:sync

cd "$(dirname "$0")/.."
exec node scripts/sync-stripe-to-firebase.js
