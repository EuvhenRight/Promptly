import type { FirebaseOptions } from 'firebase/app'

/**
 * Retrieves the Firebase configuration. This function is designed to be called
 * on the server, typically within a Server Component like the root layout.
 * It prioritizes the FIREBASE_WEBAPP_CONFIG environment variable provided by
 * Firebase App Hosting, falling back to NEXT_PUBLIC_ variables for local dev.
 */
export function getFirebaseConfig(): FirebaseOptions {
	// First, try the environment variable injected by Firebase App Hosting.
	const rawWebAppConfig = process.env.FIREBASE_WEBAPP_CONFIG
	if (rawWebAppConfig) {
		try {
			// This is the primary method for production on App Hosting.
			return JSON.parse(rawWebAppConfig)
		} catch (e) {
			console.error(
				'Failed to parse FIREBASE_WEBAPP_CONFIG. Falling back to NEXT_PUBLIC_ variables.',
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
		measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
	}

	// Only return this config if it's valid, otherwise initializeFirebase will fail.
	if (envConfig.apiKey) {
		return envConfig
	}

	// If neither config source is available, return an empty object.
	// The initializeFirebase function will then throw a clear error.
	return {}
}
