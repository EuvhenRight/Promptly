import { adminDb } from '@/firebase/admin'
import { NextResponse } from 'next/server'

const DEFAULT_MODEL_NAMES = ['Nano Banana', 'Flux', 'GPT', 'Gemini', 'Midjourney', 'Stable Diffusion', 'Sora']

export type ModelItem = { id: string; name: string }

export async function GET() {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	try {
		const snap = await adminDb.collection('models').get()
		const list: ModelItem[] = snap.docs.map(doc => ({
			id: doc.id,
			name: (doc.data().name as string) || doc.id,
		}))
		return NextResponse.json(list)
	} catch (err) {
		console.error('Fetch models error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to fetch models',
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
		const col = adminDb.collection('models')
		const body = await request.json().catch(() => null)

		if (body && typeof body === 'object' && body.name) {
			const name = String(body.name).trim()
			if (!name) {
				return NextResponse.json({ error: 'Name is required' }, { status: 400 })
			}
			const ref = await col.add({ name })
			return NextResponse.json({ success: true, id: ref.id, name })
		}

		for (const name of DEFAULT_MODEL_NAMES) {
			await col.add({ name })
		}
		return NextResponse.json({
			success: true,
			message: `Seeded ${DEFAULT_MODEL_NAMES.length} models.`,
		})
	} catch (err) {
		console.error('Models POST error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to save models',
			},
			{ status: 500 },
		)
	}
}
