
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return;
  }

  // This configuration is designed for serverless environments like Vercel or Netlify.
  // It relies exclusively on environment variables set in the hosting provider's UI.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // The private key from a JSON file has literal `\n` characters. When stored as an
  // env var, these become escaped `\\n`. This line correctly formats the key.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    const missing: string[] = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
    
    // This clear error message is crucial for debugging on hosting platforms.
    throw new Error(
      `Firebase Admin initialization failed. Missing required environment variables: ${missing.join(', ')}.`
    );
  }

  try {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: storageBucket,
    });
    console.log('Firebase Admin SDK initialized successfully from environment variables.');
  } catch (e) {
    console.error('CRITICAL: Firebase Admin SDK initialization from environment variables failed.', e);
    // Re-throw to ensure the server function fails clearly.
    throw e;
  }
}

initFirebaseAdmin();

// Use a getter function to safely access the services.
const getSafeAdminService = <T>(serviceFactory: () => T): T | null => {
  if (getApps().length > 0) {
    try {
      return serviceFactory();
    } catch (e) {
      console.error('Failed to get Firebase Admin service instance:', e);
      return null;
    }
  }
  // This case will be hit if initFirebaseAdmin() threw an error.
  console.error("Firebase Admin SDK not initialized. API calls will fail.");
  return null;
};

export const adminDb = getSafeAdminService(() => admin.firestore());
export const adminStorage = getSafeAdminService(() => admin.storage());

// Log a warning if the services are not available in production
if (process.env.NODE_ENV === 'production') {
  if (!adminDb) {
    console.warn("Firestore Admin instance (adminDb) is not available. API routes will fail.");
  }
  if (!adminStorage) {
    console.warn("Storage Admin instance (adminStorage) is not available. File uploads will fail.");
  }
}
