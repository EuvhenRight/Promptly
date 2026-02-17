'use server';
import { adminDb } from '@/firebase/admin'
import { messageForLog } from '@/lib/error-log'
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
			{
				error:
					'Firebase Admin (adminDb) is not initialized. Check server logs for `admin.ts` initialization errors.',
			},
			{ status: 503 },
		)
	}
	try {
		const tagsSnap = await adminDb.collection('tags').get()
		const allTags: TagItem[] = tagsSnap.docs.map(doc => ({
			id: doc.id,
			name: (doc.data().name as string) || doc.id,
		}))
		return NextResponse.json(allTags)

	} catch (err) {
		console.error('Fetch tags error:', messageForLog(err))
		return NextResponse.json(
			{
				error: 'Failed to fetch tags from Firestore.',
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
		console.error('Tags POST error:', messageForLog(err))
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to save tags',
			},
			{ status: 500 },
		)
	}
}
