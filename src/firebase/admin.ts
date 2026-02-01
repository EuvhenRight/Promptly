import admin from 'firebase-admin'
import { getApps } from 'firebase-admin/app'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

function getStorageBucket(): string | undefined {
	if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
		return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
	}
	// Firebase App Hosting provides FIREBASE_CONFIG or FIREBASE_WEBAPP_CONFIG
	const firebaseConfig =
		process.env.FIREBASE_CONFIG || process.env.FIREBASE_WEBAPP_CONFIG
	if (firebaseConfig) {
		try {
			const config = JSON.parse(firebaseConfig) as { storageBucket?: string }
			return config.storageBucket
		} catch {
			// ignore
		}
	}
	return undefined
}

const storageBucket = getStorageBucket()

function initFromServiceAccountFile(): boolean {
	try {
		const path = join(process.cwd(), 'service-account.json')
		if (!existsSync(path)) return false
		const serviceAccount = JSON.parse(readFileSync(path, 'utf-8'))
		if (!getApps().length && storageBucket) {
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
				storageBucket,
			})
		}
		return true
	} catch {
		return false
	}
}

function initFromEnv(): boolean {
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

function initWithApplicationDefault(): boolean {
	if (!storageBucket || getApps().length) return false
	try {
		admin.initializeApp({
			credential: admin.credential.applicationDefault(),
			storageBucket,
		})
		return true
	} catch {
		return false
	}
}

try {
	if (!storageBucket) {
		console.error(
			'Firebase Admin: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or FIREBASE_CONFIG storageBucket not set.',
		)
	} else {
		const fromFile = initFromServiceAccountFile()
		const fromEnv = !fromFile && initFromEnv()
		const fromAdc = !fromFile && !fromEnv && initWithApplicationDefault()
		if (!fromFile && !fromEnv && !fromAdc) {
			console.error(
				'Firebase Admin: add service-account.json, set FIREBASE_* env vars, or use Application Default Credentials.',
			)
		}
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
