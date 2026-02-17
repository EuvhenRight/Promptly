'use server';
import { adminDb } from '@/firebase/admin'
import { messageForLog } from '@/lib/error-log'
import { NextResponse } from 'next/server'

const DEFAULT_CATEGORY_NAMES = [
	'UGC / TikTok Ads',
	'Product / Photography',
	'Fashion / Models',
	'Cosmetics / Beauty',
	'Fantasy / AI Art',
	'Logos / Icons',
]

export type CategoryItem = { id: string; name: string }

export async function GET() {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin (adminDb) is not initialized. Check server logs for `admin.ts` initialization errors.' },
			{ status: 503 },
		)
	}
	try {
		const categoriesSnap = await adminDb.collection('categories').get()
		const allCategories: CategoryItem[] = categoriesSnap.docs.map(doc => ({
			id: doc.id,
			name: (doc.data().name as string) || doc.id,
		}))

		return NextResponse.json(allCategories)
	} catch (err) {
		console.error('Fetch categories error:', messageForLog(err))
		return NextResponse.json(
			{
				error: 'Failed to fetch categories from Firestore.',
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
		const col = adminDb.collection('categories')
		const body = await request.json().catch(() => null)

		// Create one category from body { name } – Firestore auto-generates id (same format as prompt/user ids)
		if (body && typeof body === 'object' && body.name) {
			const name = String(body.name).trim()
			if (!name) {
				return NextResponse.json({ error: 'Name is required' }, { status: 400 })
			}
			const ref = await col.add({ name })
			return NextResponse.json({ success: true, id: ref.id, name })
		}

		// Seed default categories (no body) – each gets an auto-generated id
		for (const name of DEFAULT_CATEGORY_NAMES) {
			await col.add({ name })
		}
		return NextResponse.json({
			success: true,
			message: `Seeded ${DEFAULT_CATEGORY_NAMES.length} categories.`,
		})
	} catch (err) {
		console.error('Categories POST error:', messageForLog(err))
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to save categories',
			},
			{ status: 500 },
		)
	}
}
