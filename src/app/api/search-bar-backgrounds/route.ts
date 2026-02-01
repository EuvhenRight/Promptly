import { adminDb } from '@/firebase/admin'
import admin from 'firebase-admin'
import { NextResponse } from 'next/server'

export type SearchBarBackgroundItem = {
	id: string
	imageUrl: string
	name: string
	isActive: boolean
	createdAt: string | null
}

export async function GET(request: Request) {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	try {
		const { searchParams } = new URL(request.url)
		const activeOnly = searchParams.get('active') === 'true'

		const snap = await adminDb
			.collection('searchBarBackgrounds')
			.orderBy('createdAt', 'desc')
			.get()

		const items: SearchBarBackgroundItem[] = snap.docs.map(doc => {
			const d = doc.data()
			return {
				id: doc.id,
				imageUrl: (d.imageUrl as string) || '',
				name: (d.name as string) || '',
				isActive: !!d.isActive,
				createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
			}
		})

		if (activeOnly) {
			const active = items.find(i => i.isActive)
			return NextResponse.json(active ?? null, {
				headers: { 'Cache-Control': 'no-store, max-age=0' },
			})
		}

		return NextResponse.json(items)
	} catch (err) {
		console.error('Search bar backgrounds GET error:', err)
		return NextResponse.json(
			{
				error:
					err instanceof Error ? err.message : 'Failed to fetch backgrounds',
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
		const body = await request.json().catch(() => null)
		const imageUrl = body?.imageUrl
		const name = body?.name != null ? String(body.name).trim() : ''
		const isActive = !!body?.isActive

		if (!imageUrl || typeof imageUrl !== 'string') {
			return NextResponse.json(
				{ error: 'imageUrl is required' },
				{ status: 400 },
			)
		}

		const col = adminDb.collection('searchBarBackgrounds')

		if (isActive) {
			const existing = await col.where('isActive', '==', true).get()
			const batch = adminDb.batch()
			existing.docs.forEach(d => batch.update(d.ref, { isActive: false }))
			if (!existing.empty) await batch.commit()
		}

		const ref = await col.add({
			imageUrl,
			name: name || 'Untitled',
			isActive,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		})

		return NextResponse.json({
			success: true,
			id: ref.id,
			imageUrl,
			name: name || 'Untitled',
			isActive,
		})
	} catch (err) {
		console.error('Search bar backgrounds POST error:', err)
		return NextResponse.json(
			{
				error:
					err instanceof Error ? err.message : 'Failed to create background',
			},
			{ status: 500 },
		)
	}
}
