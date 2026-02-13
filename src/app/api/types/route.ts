import { adminDb } from '@/firebase/admin'
import { NextResponse } from 'next/server'

const DEFAULT_TYPE_NAMES = ['Video', 'Images', 'Audio']

export type TypeItem = { id: string; name: string }

export async function GET() {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	try {
		const promptsSnap = await adminDb.collection('prompts').select('typeId').get()
		const activeTypeIds = new Set<string>()
		promptsSnap.docs.forEach(doc => {
			const typeId = doc.data().typeId
			if (typeId) {
				activeTypeIds.add(typeId)
			}
		})

		if (activeTypeIds.size === 0) {
			return NextResponse.json([])
		}

		const typesSnap = await adminDb.collection('types').get()
		const allTypes: TypeItem[] = typesSnap.docs.map(doc => ({
			id: doc.id,
			name: (doc.data().name as string) || doc.id,
		}))

		const activeTypes = allTypes.filter(type => activeTypeIds.has(type.id))

		return NextResponse.json(activeTypes)
	} catch (err) {
		console.error('Fetch types error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to fetch types',
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
		const col = adminDb.collection('types')
		const body = await request.json().catch(() => null)

		if (body && typeof body === 'object' && body.name) {
			const name = String(body.name).trim()
			if (!name) {
				return NextResponse.json({ error: 'Name is required' }, { status: 400 })
			}
			const ref = await col.add({ name })
			return NextResponse.json({ success: true, id: ref.id, name })
		}

		for (const name of DEFAULT_TYPE_NAMES) {
			await col.add({ name })
		}
		return NextResponse.json({
			success: true,
			message: `Seeded ${DEFAULT_TYPE_NAMES.length} types.`,
		})
	} catch (err) {
		console.error('Types POST error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to save types',
			},
			{ status: 500 },
		)
	}
}
