import admin from 'firebase-admin'
import { getApps, App } from 'firebase-admin/app'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

let app: App | null = null;

function initializeAdminApp(): App | null {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
        console.error("Firebase Admin: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set.");
        return null;
    }

    // 1. Vercel / Production Environment Variables
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
            return admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
                storageBucket: storageBucket,
            });
        } catch (e) {
            console.error("Error initializing admin from Vercel environment variables:", e);
            // Fall through to try other methods
        }
    }

    // 2. Local development with service-account.json
    try {
        const serviceAccountPath = join(process.cwd(), 'service-account.json');
        if (existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: storageBucket,
            });
        }
    } catch (e) {
        console.error("Error initializing admin from service-account.json:", e);
    }
    
    // 3. Firebase App Hosting / Google Cloud Environment (Application Default Credentials)
    try {
        // This will automatically use the runtime's service account.
        return admin.initializeApp({
            storageBucket,
        });
    } catch(e) {
       console.error("Error initializing with Application Default Credentials:", e);
    }
    
    console.error("Firebase Admin SDK initialization failed. None of the available methods succeeded.");
    return null;
}

app = initializeAdminApp();

export const adminDb = app ? admin.firestore() : null;
export const adminStorage = app ? admin.storage() : null;
