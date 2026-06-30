import { getAuth as getAdminAuth } from 'firebase-admin/auth'
import { adminDb } from '@/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Verifies the Firebase ID token from the Authorization header and checks
 * if the user has an 'admin' role in their Firestore document.
 *
 * @param req The NextRequest object.
 * @returns A NextResponse if unauthorized or an error occurs, otherwise null.
 */
export async function verifyAdmin(
	req: NextRequest,
): Promise<NextResponse | null> {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	const token = req.headers.get('Authorization')?.split('Bearer ')[1]
	if (!token) {
		return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 })
	}

	try {
		const adminAuth = getAdminAuth()
		const decodedToken = await adminAuth.verifyIdToken(token)
		const userId = decodedToken.uid

		const userDoc = await adminDb.collection('users').doc(userId).get()
		if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
			return NextResponse.json(
				{ error: 'Forbidden: Admin role required' },
				{ status: 403 },
			)
		}
		// User is an admin, allow the request to proceed
		return null
	} catch (error) {
		console.error('Admin verification error:', error)
		return NextResponse.json(
			{ error: 'Unauthorized: Invalid token' },
			{ status: 401 },
		)
	}
}
