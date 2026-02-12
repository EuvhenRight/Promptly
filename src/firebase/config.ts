
import type { FirebaseOptions } from 'firebase/app'

/**
 * Retrieves the Firebase configuration. This function is designed to be called
 * on the server, typically within a Server Component like the root layout.
 * It prioritizes environment variables provided by
 * Firebase App Hosting, falling back to NEXT_PUBLIC_ variables for local dev.
 * It also includes a fallback for build-time static generation.
 */
export function getFirebaseConfig(): FirebaseOptions {
	// 1. Try App Hosting environment variables first. This is the primary method for production.
	// We prioritize FIREBASE_WEBAPP_CONFIG because it is the complete client-side config.
	const appHostingConfig =
		process.env.FIREBASE_WEBAPP_CONFIG || process.env.FIREBASE_CONFIG
	if (appHostingConfig) {
		try {
			return JSON.parse(appHostingConfig)
		} catch (e) {
			console.error(
				'Failed to parse FIREBASE_WEBAPP_CONFIG/FIREBASE_CONFIG. Falling back.',
				e,
			)
		}
	}

	// 2. Try local development environment variables (from .env.local).
	const localDevConfig = {
		apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
		authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
		messagingSenderId:
			process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
		appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
	}
	if (localDevConfig.apiKey) {
		return localDevConfig
	}

    // 3. Fallback for build-time static generation (e.g., for /_not-found).
    // This allows the `next build` command to succeed even if env vars are not available
    // during the prerendering of certain static pages.
    if (process.env.NODE_ENV === 'production') {
        return {
            apiKey: "build-time-dummy-key",
            authDomain: "build-time-dummy.firebaseapp.com",
            projectId: "build-time-dummy",
            storageBucket: "build-time-dummy.appspot.com",
            messagingSenderId: "0",
            appId: "1:0:web:build-time-dummy"
        };
    }

	// 4. If no config is found after all checks, return an empty object.
	// This will cause initializeFirebase to throw a clear, helpful error.
	return {}
}
