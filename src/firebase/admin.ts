import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Use only the project from .env (e.g. studio-2725546260-fde38). Do not use other projects (e.g. cybersoek).
function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  const serviceAccountPath = join(process.cwd(), 'service-account.json');

  // 1) Prefer service-account.json so project is explicit
  if (existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucket,
      });
      console.log('Firebase Admin SDK initialized with service-account.json (project:', serviceAccount.project_id, ').');
      return;
    } catch (e) {
      console.error('CRITICAL: Failed to initialize Firebase Admin with service-account.json.', e);
      return;
    }
  }

  // 2) Use .env credentials so we never fall back to ADC/cybersoek when .env has the project
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        } as admin.ServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
      });
      console.log('Firebase Admin SDK initialized from .env (project:', projectId, ').');
      return;
    } catch (e) {
      console.error('CRITICAL: Failed to initialize Firebase Admin from .env.', e);
      return;
    }
  }

  // 3) Production only: ADC (e.g. App Hosting). Ensure default GCP project is the Promptly project, not another project.
  try {
    console.log('service-account.json not found and FIREBASE_* env not set. Using Application Default Credentials.');
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized with ADC.');
  } catch (e) {
    console.error('CRITICAL: Firebase Admin initialization failed. Use service-account.json or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.', e);
  }
}

initFirebaseAdmin();

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
