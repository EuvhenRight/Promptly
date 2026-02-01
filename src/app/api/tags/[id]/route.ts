import { adminDb } from '@/firebase/admin'
import { NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	const { id } = await params
	if (!id) {
		return NextResponse.json({ error: 'Missing tag id' }, { status: 400 })
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
		const ref = adminDb.collection('tags').doc(id)
		const snap = await ref.get()
		if (!snap.exists) {
			return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
		}
		await ref.update({ name })
		return NextResponse.json({ success: true, id, name })
	} catch (err) {
		console.error('Tag PATCH error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to update tag',
			},
			{ status: 500 },
		)
	}
}

export async function DELETE(_request: Request, { params }: RouteParams) {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	const { id } = await params
	if (!id) {
		return NextResponse.json({ error: 'Missing tag id' }, { status: 400 })
	}
	try {
		const ref = adminDb.collection('tags').doc(id)
		const snap = await ref.get()
		if (!snap.exists) {
			return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
		}
		await ref.delete()
		return NextResponse.json({ success: true, id })
	} catch (err) {
		console.error('Tag DELETE error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to delete tag',
			},
			{ status: 500 },
		)
	}
}
