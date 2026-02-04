// This file is neutral (can be used on client or server)
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  // Always use the explicit firebaseConfig object.
  // This object is populated from environment variables by `config.ts`.
  if (!firebaseConfig.apiKey) {
    // If the config is empty, it means environment variables are not set.
    // This is a more helpful error than the generic Firebase one.
    throw new Error(
      'Firebase configuration is missing. For production builds, ensure Firebase environment variables (like FIREBASE_WEBAPP_CONFIG or NEXT_PUBLIC_FIREBASE_API_KEY) are set. For local development, create a `.env.local` file in your project root with your Firebase config.'
    );
  }
  
  const firebaseApp = initializeApp(firebaseConfig);


  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}
