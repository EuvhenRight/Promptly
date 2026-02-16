import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Simplified initialization logic for better compatibility with different dev environments.
if (getApps().length === 0) {
  const serviceAccountPath = join(process.cwd(), 'service-account.json');

  if (existsSync(serviceAccountPath)) {
    console.log("Attempting to initialize Firebase Admin with service-account.json...");
    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucket,
      });
      console.log('Firebase Admin SDK initialized successfully with service-account.json.');
    } catch (e) {
      console.error('CRITICAL: Failed to initialize Firebase Admin with service-account.json.', e);
    }
  } else {
      // Fallback for production environments like App Hosting that use Application Default Credentials.
      try {
        console.log('service-account.json not found. Attempting to initialize with Application Default Credentials...');
        admin.initializeApp();
        console.log('Firebase Admin SDK initialized successfully with ADC.');
      } catch (e) {
         console.error('CRITICAL: Firebase Admin SDK initialization failed completely. service-account.json was not found and Application Default Credentials did not work.', e);
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
