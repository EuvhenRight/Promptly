
import type { FirebaseOptions } from 'firebase/app'

/**
 * Retrieves the Firebase configuration. This function is designed to be called
 * on the server, typically within a Server Component like the root layout.
 * It prioritizes environment variables provided by
 * Firebase App Hosting, falling back to NEXT_PUBLIC_ variables for local dev.
 */
export function getFirebaseConfig(): FirebaseOptions {
	// App Hosting provides FIREBASE_CONFIG and/or FIREBASE_WEBAPP_CONFIG
	const firebaseConfig =
		process.env.FIREBASE_CONFIG || process.env.FIREBASE_WEBAPP_CONFIG
	if (firebaseConfig) {
		try {
			// This is the primary method for production on App Hosting.
			return JSON.parse(firebaseConfig)
		} catch (e) {
			console.error(
				'Failed to parse FIREBASE_CONFIG/FIREBASE_WEBAPP_CONFIG. Falling back to NEXT_PUBLIC_ variables.',
				e,
			)
		}
	}

	// Fallback for local development using .env.local or other env sources.
	const envConfig = {
		apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
		authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
		messagingSenderId:
			process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
		appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
	}

	// Only return this config if it's valid.
	if (envConfig.apiKey) {
		return envConfig
	}

    // During a production build, if no config is found, it's likely because
    // we're prerendering a static page (like /_not-found) where env vars
    // are not available. We provide a dummy config to allow the build to pass.
    // At runtime, the server-side env vars will be available for server components.
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

	// If neither config source is available (e.g. local dev without .env.local),
    // return an empty object to trigger a clear error in initializeFirebase.
	return {}
}
