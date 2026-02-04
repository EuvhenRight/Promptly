// This file is neutral (can be used on client or server)
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(config?: FirebaseOptions) {
  if (getApps().length) {
    return getSdks(getApp());
  }

  // A config must be provided, especially for App Hosting.
  if (!config?.apiKey) {
    // If the config is empty, it means environment variables are not set.
    // This is a more helpful error than the generic Firebase one.
    throw new Error(
      'Firebase configuration is missing. For production builds, ensure Firebase environment variables (like FIREBASE_WEBAPP_CONFIG or NEXT_PUBLIC_FIREBASE_API_KEY) are set. For local development, create a .env.local file in your project root with your Firebase config.'
    );
  }
  
  const firebaseApp = initializeApp(config);


  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}
