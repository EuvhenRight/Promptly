'use server'
import { adminDb } from '@/firebase/admin'
import { verifyAdmin } from '@/lib/admin-auth'
import { messageForLog } from '@/lib/error-log'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_TYPE_NAMES = ['Video', 'Images', 'Audio']

export type TypeItem = { id: string; name: string }

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
		const typesSnap = await adminDb.collection('types').get()
		const allTypes: TypeItem[] = typesSnap.docs.map(doc => ({
			id: doc.id,
			name: (doc.data().name as string) || doc.id,
		}))
		return NextResponse.json(allTypes)
	} catch (err) {
		console.error('Fetch types error:', messageForLog(err))
		return NextResponse.json(
			{
				error: 'Failed to fetch types from Firestore.',
			},
			{ status: 500 },
		)
	}
}

export async function POST(request: NextRequest) {
	const adminCheck = await verifyAdmin(request)
	if (adminCheck) return adminCheck

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
		console.error('Types POST error:', messageForLog(err))
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to save types',
			},
			{ status: 500 },
		)
	}
}
