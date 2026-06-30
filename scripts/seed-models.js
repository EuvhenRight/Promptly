/**
 * Standalone script to seed the Firestore "models" collection.
 * Run from project root: node scripts/seed-models.js
 */
const path = require('path')
const admin = require('firebase-admin')

// IMPORTANT: Make sure you have service-account.json in your project root
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json')
try {
  const serviceAccount = require(serviceAccountPath)
  if (!admin.apps.length) {
	  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }
} catch (e) {
  console.error('Error initializing Firebase Admin. Please ensure service-account.json exists in the project root.');
  process.exit(1);
}


const DEFAULT_NAMES = ['Nano Banana', 'Flux', 'GPT', 'Gemini', 'Midjourney', 'Stable Diffusion', 'Sora']

const db = admin.firestore()

async function seed() {
	const col = db.collection('models')
	for (const name of DEFAULT_NAMES) {
		await col.add({ name })
	}
	console.log(
		'Done. Seeded',
		DEFAULT_NAMES.length,
		'models (auto-generated IDs).',
	)
}

seed()
	.then(() => process.exit(0))
	.catch(err => {
		console.error('Seed failed:', err)
		process.exit(1)
	})
