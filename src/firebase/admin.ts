
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// IMPORTANT: This initialization assumes you have a 'service-account.json' file
// in the root of your project. For production, it's highly recommended to use
// environment variables instead of a file.
try {
  // The 'require' path is relative to the compiled output in .next, so we go up more levels.
  const serviceAccount = require('../../service-account.json');
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!storageBucket) {
    throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set in your environment variables.');
  }

  if (!getApps().length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: storageBucket,
    });
  }
} catch (error: any) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error(
      "Firebase Admin initialization failed: 'service-account.json' not found in the project root. This file is required for server-side operations like the scraper."
    );
  } else {
    console.error(
      'Firebase Admin initialization failed:',
      error.message
    );
  }
}

// We check if the apps array is populated before trying to get services.
// If initialization failed, this will throw a more specific error later on.
const adminStorage = getApps().length ? admin.storage() : null;
const adminDb = getApps().length ? admin.firestore() : null;

export { adminStorage, adminDb };
