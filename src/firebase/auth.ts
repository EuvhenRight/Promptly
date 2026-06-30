'use client';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';

export function signInWithGoogle() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch((error) => {
    // This is a good place to add telemetry or more robust error handling.
    // For now, we'll log to the console. The user will see the popup error.
    console.error('Google Sign-In Error:', error);
  });
}

export function signOutUser() {
  const auth = getAuth();
  return signOut(auth);
}
