import admin from 'firebase-admin'
import { getApps, App } from 'firebase-admin/app'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

let app: App | null = null;

function initializeAdminApp(): App | null {
    // If already initialized, return the existing app.
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    // Method 1: Explicit Service Account credentials from environment variables.
    // This is common for Vercel, Netlify, or local .env files.
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
            console.log("Attempting to initialize Firebase Admin with environment variables...");
            return admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
                storageBucket: storageBucket,
            });
        } catch (e) {
            console.error("Firebase Admin: Error initializing from environment variables:", e);
        }
    }

    // Method 2: Service account file for local development.
    try {
        const serviceAccountPath = join(process.cwd(), 'service-account.json');
        if (existsSync(serviceAccountPath)) {
            console.log("Attempting to initialize Firebase Admin with service-account.json...");
            const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: storageBucket,
            });
        }
    } catch (e) {
        console.error("Firebase Admin: Error initializing from service-account.json:", e);
    }
    
    // Method 3: Application Default Credentials (ADC) for Google Cloud environments.
    // This will work automatically on App Hosting, Cloud Run, Cloud Functions etc.
    // It will also work locally if the user has run `gcloud auth application-default login`.
    // The presence of GOOGLE_CLOUD_PROJECT is a good indicator of a GCP environment.
    if (process.env.GOOGLE_CLOUD_PROJECT) {
        try {
            console.log("Attempting to initialize Firebase Admin with Application Default Credentials...");
            return admin.initializeApp({
                storageBucket,
            });
        } catch(e) {
           console.error("Firebase Admin: Error initializing with Application Default Credentials:", e);
        }
    }
    
    // If none of the above methods worked, provide a helpful error message for local development.
    if (process.env.NODE_ENV === 'development') {
        console.error(`
====================================================================================================
Firebase Admin SDK a.k.a. server-side authentication is not configured.
Your API routes (e.g., for fetching tags, categories) will not work until this is fixed.

To fix this, do one of the following:

1. (Recommended) Create a 'service-account.json' file in your project root.
   - Go to Firebase Console > Project Settings > Service accounts.
   - Select your project, and click "Generate new private key".
   - Download the JSON file and rename it to 'service-account.json'.
   - Place it in the root of your project.

2. (Alternative) Set service account details in your '.env.local' file:
   FIREBASE_PROJECT_ID="<your-project-id>"
   FIREBASE_CLIENT_EMAIL="<your-client-email>"
   FIREBASE_PRIVATE_KEY="<your-private-key>"

The server failed to start because it couldn't find any of these credentials.
====================================================================================================
        `);
    } else {
        // In production, this is a critical failure.
        console.error("CRITICAL: Firebase Admin SDK initialization failed. No credentials found in the production environment.");
    }
    
    // Return null if initialization fails, so API routes can handle it gracefully.
    return null;
}

// Initialize the app on module load.
app = initializeAdminApp();

export const adminDb = app ? admin.firestore() : null;
export const adminStorage = app ? admin.storage() : null;
