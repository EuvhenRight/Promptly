import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

if (getApps().length === 0) {
  try {
    // This will succeed on App Hosting and other Google Cloud environments
    console.log('Attempting to initialize Firebase Admin with Application Default Credentials...');
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully with ADC.');
  } catch (e) {
    console.warn('Admin SDK initialization with ADC failed, trying service account file...', (e as Error).message);
    // This is the fallback for local development
    try {
      const serviceAccountPath = join(process.cwd(), 'service-account.json');
      if (existsSync(serviceAccountPath)) {
        console.log("Attempting to initialize Firebase Admin with service-account.json...");
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
        const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: storageBucket,
        });
        console.log('Firebase Admin SDK initialized successfully with service-account.json.');
      } else {
        console.error('service-account.json not found, and ADC failed. Admin SDK is not initialized.');
      }
    } catch (e2) {
      console.error('CRITICAL: Firebase Admin SDK initialization failed completely.', e2);
    }
  }
}

// Use a getter function to safely access the services.
// This ensures that even if initialization fails, the app won't crash on module load.
const getSafeAdminService = <T>(serviceFactory: () => T): T | null => {
  if (getApps().length > 0) {
    try {
      return serviceFactory();
    } catch (e) {
      console.error('Failed to get admin service:', e);
      return null;
    }
  }
  return null;
};

export const adminDb = getSafeAdminService(() => admin.firestore());
export const adminStorage = getSafeAdminService(() => admin.storage());

// Log a warning if the services are not available in production
if (process.env.NODE_ENV === 'production') {
  if (!adminDb) {
    console.error("FATAL: Firestore Admin instance (adminDb) is not available. API routes will fail.");
  }
  if (!adminStorage) {
    console.error("FATAL: Storage Admin instance (adminStorage) is not available. File uploads will fail.");
  }
}
