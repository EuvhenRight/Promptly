import { adminDb } from '@/firebase/admin'
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
		return NextResponse.json({ error: 'Missing category id' }, { status: 400 })
	}
	try {
		const body = await request.json().catch(() => null)
		const name = body?.name != null ? String(body.name).trim() : null
		if (!name) {
			return NextResponse.json(
				{ error: 'Body must include name' },
				{ status: 400 },
			)
		}
		const ref = adminDb.collection('categories').doc(id)
		const snap = await ref.get()
		if (!snap.exists) {
			return NextResponse.json({ error: 'Category not found' }, { status: 404 })
		}
		await ref.update({ name })
		return NextResponse.json({ success: true, id, name })
	} catch (err) {
		console.error('Category PATCH error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to update category',
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
		return NextResponse.json({ error: 'Missing category id' }, { status: 400 })
	}
	try {
		const ref = adminDb.collection('categories').doc(id)
		const snap = await ref.get()
		if (!snap.exists) {
			return NextResponse.json({ error: 'Category not found' }, { status: 404 })
		}
		await ref.delete()
		return NextResponse.json({ success: true, id })
	} catch (err) {
		console.error('Category DELETE error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to delete category',
			},
			{ status: 500 },
		)
	}
}
