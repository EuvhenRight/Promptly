'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  let firebaseApp;
  
  // In a production environment (like Firebase App Hosting), try to initialize automatically.
  // In development, use the explicit config from `.env.local`.
  if (process.env.NODE_ENV === 'production') {
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      console.warn("Automatic Firebase initialization failed in production. Falling back to explicit config.", e);
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    // Development environment
    if (!firebaseConfig.apiKey) {
        console.error(
          'Firebase API Key is missing. Please make sure your .env.local file is set up correctly with the NEXT_PUBLIC_FIREBASE_API_KEY variable. You may need to restart your development server after creating or updating the .env.local file.'
        );
    }
    firebaseApp = initializeApp(firebaseConfig);
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
