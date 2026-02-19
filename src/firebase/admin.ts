import admin from 'firebase-admin'
import { getApps } from 'firebase-admin/app'
import { readFileSync } from 'fs'
import path from 'path'

function initFirebaseAdmin() {
	if (getApps().length > 0) {
		return
	}

	// This configuration is designed for hybrid environments (local dev + serverless hosting).
	// It prioritizes a Base64-encoded service account from an environment variable,
	// which is the most secure and reliable method for hosting platforms.
	// As a fallback for local development, it will look for a physical `service-account.json` file.

	// 1. Try to initialize from Base64 environment variable (for production/hosting)
	if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
		try {
			const decodedServiceAccount = Buffer.from(
				process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
				'base64',
			).toString('utf-8')
			const serviceAccount = JSON.parse(decodedServiceAccount)
			const storageBucket =
				serviceAccount.project_id + '.appspot.com'

			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
				storageBucket: storageBucket,
			})
			console.log(
				'Firebase Admin SDK initialized successfully from Base64 env var.',
			)
			return // Success
		} catch (e) {
			console.error(
				'CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64. Check the variable.',
				e,
			)
			// Don't throw yet, fallback to file-based method
		}
	}
	
	// 2. Fallback to local service-account.json file (for local development)
	try {
		const serviceAccountPath = path.join(
			process.cwd(),
			'service-account.json',
		)
		const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
		const storageBucket =
			process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
			`${serviceAccount.project_id}.appspot.com`

		admin.initializeApp({
			credential: admin.credential.cert(serviceAccount),
			storageBucket: storageBucket,
		})
		console.log(
			'Firebase Admin SDK initialized successfully from service-account.json file.',
		)
		return // Success
	} catch (e: any) {
		if (e.code === 'ENOENT') {
			console.warn(
				'Firebase Admin: No `service-account.json` found and `FIREBASE_SERVICE_ACCOUNT_BASE64` is not set. Admin features will be disabled.',
			)
		} else {
			console.error(
				'CRITICAL: Firebase Admin SDK initialization from file failed.',
				e,
			)
		}
		// Initialization failed completely. The getters below will return null.
	}
}

initFirebaseAdmin()

// Use a getter function to safely access the services.
const getSafeAdminService = <T>(serviceFactory: () => T): T | null => {
	if (getApps().length > 0) {
		try {
			return serviceFactory()
		} catch (e) {
			console.error('Failed to get Firebase Admin service instance:', e)
			return null
		}
	}
	// This case will be hit if initFirebaseAdmin() failed.
	console.error('Firebase Admin SDK not initialized. API calls will fail.')
	return null
}

export const adminDb = getSafeAdminService(() => admin.firestore())
export const adminStorage = getSafeAdminService(() => admin.storage())

// Log a warning if the services are not available in production
if (process.env.NODE_ENV === 'production') {
	if (!adminDb) {
		console.warn(
			'Firestore Admin instance (adminDb) is not available. API routes will fail.',
		)
	}
	if (!adminStorage) {
		console.warn(
			'Storage Admin instance (adminStorage) is not available. File uploads will fail.',
		)
	}
}
