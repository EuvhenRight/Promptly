/**
 * Standalone script to seed the Firestore "categories" collection.
 * Run from project root: node scripts/seed-categories.js
 * Or run this file with Code Runner.
 */
const path = require('path')
const admin = require('firebase-admin')

const serviceAccountPath = path.join(__dirname, '..', 'service-account.json')
const serviceAccount = require(serviceAccountPath)

if (!admin.apps.length) {
	admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

const DEFAULT_NAMES = [
	'UGC / TikTok Ads',
	'Product / Photography',
	'Fashion / Models',
	'Cosmetics / Beauty',
	'Fantasy / AI Art',
	'Logos / Icons',
]

const db = admin.firestore()

async function seed() {
	const col = db.collection('categories')
	for (const name of DEFAULT_NAMES) {
		await col.add({ name })
	}
	console.log(
		'Done. Seeded',
		DEFAULT_NAMES.length,
		'categories (auto-generated IDs).',
	)
}

seed()
	.then(() => process.exit(0))
	.catch(err => {
		console.error('Seed failed:', err)
		process.exit(1)
	})
