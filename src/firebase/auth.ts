'use client';
import {
  getAuth,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';

export function signInWithGoogle() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  // CRITICAL: Do NOT await this. Let the onAuthStateChanged listener handle the result.
  signInWithRedirect(auth, provider).catch((error) => {
    // This is a good place to add telemetry or more robust error handling.
    // For now, we'll log to the console. The user will see the popup error.
    console.error('Google Sign-In Error:', error);
  });
}

export function signOutUser() {
  const auth = getAuth();
  // CRITICAL: Do NOT await this.
  signOut(auth).catch((error) => {
    console.error('Sign Out Error:', error);
  });
}
