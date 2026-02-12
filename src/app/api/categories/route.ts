import { adminDb } from '@/firebase/admin'
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
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	try {
		const promptsSnap = await adminDb
			.collection('prompts')
			.select('categoryId', 'categories')
			.get()
		const activeCategoryIds = new Set<string>()
		promptsSnap.docs.forEach(doc => {
			const data = doc.data()
			if (data.categoryId) {
				activeCategoryIds.add(data.categoryId)
			}
			// Legacy support for 'categories' array
			if (Array.isArray(data.categories)) {
				data.categories.forEach(catId => activeCategoryIds.add(catId))
			}
		})

		if (activeCategoryIds.size === 0) {
			return NextResponse.json([])
		}

		const categoriesSnap = await adminDb.collection('categories').get()
		const allCategories: CategoryItem[] = categoriesSnap.docs.map(doc => ({
			id: doc.id,
			name: (doc.data().name as string) || doc.id,
		}))

		const activeCategories = allCategories.filter(cat =>
			activeCategoryIds.has(cat.id),
		)

		return NextResponse.json(activeCategories)
	} catch (err) {
		console.error('Fetch categories error:', err)
		return NextResponse.json(
			{
				error:
					err instanceof Error ? err.message : 'Failed to fetch categories',
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
		console.error('Categories POST error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to save categories',
			},
			{ status: 500 },
		)
	}
}
