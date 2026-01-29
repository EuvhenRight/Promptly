import admin from 'firebase-admin'
import { getApps } from 'firebase-admin/app'

const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

function initFromServiceAccountFile() {
	try {
		const serviceAccount = require('../../service-account.json')
		if (!getApps().length && storageBucket) {
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
				storageBucket,
			})
		}
		return true
	} catch (err: unknown) {
		if (
			err &&
			typeof err === 'object' &&
			'code' in err &&
			err.code === 'MODULE_NOT_FOUND'
		) {
			return false
		}
		throw err
	}
}

function initFromEnv() {
	const projectId =
		process.env.FIREBASE_PROJECT_ID ||
		process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
	const privateKey = process.env.FIREBASE_PRIVATE_KEY
	if (!projectId || !clientEmail || !privateKey || !storageBucket) return false
	if (!getApps().length) {
		admin.initializeApp({
			credential: admin.credential.cert({
				projectId,
				clientEmail,
				privateKey: privateKey.replace(/\\n/g, '\n'),
			}),
			storageBucket,
		})
	}
	return true
}

try {
	if (!storageBucket) {
		throw new Error(
			'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set in your environment variables.',
		)
	}
	const fromFile = initFromServiceAccountFile()
	if (!fromFile && !initFromEnv()) {
		console.error(
			'Firebase Admin: add service-account.json in the project root, or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env',
		)
	}
} catch (error: unknown) {
	const message = error instanceof Error ? error.message : String(error)
	console.error('Firebase Admin initialization failed:', message)
}

// We check if the apps array is populated before trying to get services.
// If initialization failed, this will throw a more specific error later on.
const adminStorage = getApps().length ? admin.storage() : null
const adminDb = getApps().length ? admin.firestore() : null

export { adminDb, adminStorage }
