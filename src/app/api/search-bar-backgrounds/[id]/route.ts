import { adminDb } from '@/firebase/admin'
import admin from 'firebase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
	const id = request.nextUrl.pathname.split('/').pop()
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	if (!id) {
		return NextResponse.json({ error: 'Missing id' }, { status: 400 })
	}
	try {
		const body = await request.json().catch(() => null)
		const ref = adminDb.collection('searchBarBackgrounds').doc(id)
		const snap = await ref.get()
		if (!snap.exists) {
			return NextResponse.json(
				{ error: 'Background not found' },
				{ status: 404 },
			)
		}

		const updates: Record<string, unknown> = {
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		}
		if (body?.imageUrl != null) updates.imageUrl = String(body.imageUrl)
		if (body?.name != null)
			updates.name = String(body.name).trim() || 'Untitled'
		if (body?.isActive != null) {
			const isActive = !!body.isActive
			updates.isActive = isActive
			if (isActive) {
				const existing = await adminDb
					.collection('searchBarBackgrounds')
					.where('isActive', '==', true)
					.get()
				const batch = adminDb.batch()
				existing.docs.forEach(d => {
					if (d.id !== id) batch.update(d.ref, { isActive: false })
				})
				if (!existing.empty) await batch.commit()
			}
		}

		await ref.update(updates)
		const updated = await ref.get()
		const d = updated.data()
		return NextResponse.json({
			success: true,
			id,
			imageUrl: d?.imageUrl ?? '',
			name: d?.name ?? '',
			isActive: !!d?.isActive,
		})
	} catch (err) {
		console.error('Search bar background PATCH error:', err)
		return NextResponse.json(
			{
				error:
					err instanceof Error ? err.message : 'Failed to update background',
			},
			{ status: 500 },
		)
	}
}

export async function DELETE(request: NextRequest) {
	const id = request.nextUrl.pathname.split('/').pop()
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	if (!id) {
		return NextResponse.json({ error: 'Missing id' }, { status: 400 })
	}
	try {
		const ref = adminDb.collection('searchBarBackgrounds').doc(id)
		const snap = await ref.get()
		if (!snap.exists) {
			return NextResponse.json(
				{ error: 'Background not found' },
				{ status: 404 },
			)
		}
		await ref.delete()
		return NextResponse.json({ success: true, id })
	} catch (err) {
		console.error('Search bar background DELETE error:', err)
		return NextResponse.json(
			{
				error:
					err instanceof Error ? err.message : 'Failed to delete background',
			},
			{ status: 500 },
		)
	}
}
