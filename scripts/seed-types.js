/**
 * Standalone script to seed the Firestore "types" collection.
 * Run from project root: node scripts/seed-types.js
 */
const path = require('path')
const admin = require('firebase-admin')

const serviceAccountPath = path.join(__dirname, '..', 'service-account.json')
const serviceAccount = require(serviceAccountPath)

if (!admin.apps.length) {
	admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

const DEFAULT_NAMES = ['Video', 'Images', 'Audio']

const db = admin.firestore()

async function seed() {
	const col = db.collection('types')
	for (const name of DEFAULT_NAMES) {
		await col.add({ name })
	}
	console.log(
		'Done. Seeded',
		DEFAULT_NAMES.length,
		'types (auto-generated IDs).',
	)
}

seed()
	.then(() => process.exit(0))
	.catch(err => {
		console.error('Seed failed:', err)
		process.exit(1)
	})
