import { adminDb } from '@/firebase/admin'
import { NextResponse } from 'next/server'

const DEFAULT_TAG_NAMES = [
	'ChatGPT Image',
	'Midjourney',
	'FLUX',
	'Sora',
	'Stable Diffusion',
	'Portraits',
	'Photography',
	'Anime',
	'Logo',
	'Character Design',
]

export type TagItem = { id: string; name: string }

export async function GET() {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	try {
		const promptsSnap = await adminDb.collection('prompts').select('tags').get()
		const activeTagIds = new Set<string>()
		promptsSnap.docs.forEach(doc => {
			const tags = doc.data().tags
			if (Array.isArray(tags)) {
				tags.forEach(tagId => activeTagIds.add(tagId))
			}
		})

		if (activeTagIds.size === 0) {
			return NextResponse.json([])
		}

		const tagsSnap = await adminDb.collection('tags').get()
		const allTags: TagItem[] = tagsSnap.docs.map(doc => ({
			id: doc.id,
			name: (doc.data().name as string) || doc.id,
		}))

		const activeTags = allTags.filter(tag => activeTagIds.has(tag.id))

		return NextResponse.json(activeTags)
	} catch (err) {
		console.error('Fetch tags error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to fetch tags',
			},
			{ status: 500 },
		)
	}
}

export async function POST(request: Request) {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}

	try {
		const col = adminDb.collection('tags')
		const body = await request.json().catch(() => null)

		// Create one tag from body { name } – Firestore auto-generates id
		if (body && typeof body === 'object' && body.name) {
			const name = String(body.name).trim()
			if (!name) {
				return NextResponse.json({ error: 'Name is required' }, { status: 400 })
			}
			const ref = await col.add({ name })
			return NextResponse.json({ success: true, id: ref.id, name })
		}

		// Seed default tags (no body)
		for (const name of DEFAULT_TAG_NAMES) {
			await col.add({ name })
		}
		return NextResponse.json({
			success: true,
			message: `Seeded ${DEFAULT_TAG_NAMES.length} tags.`,
		})
	} catch (err) {
		console.error('Tags POST error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to save tags',
			},
			{ status: 500 },
		)
	}
}
