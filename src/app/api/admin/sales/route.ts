import { adminDb } from '@/firebase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		);
	}
	try {
		const salesSnap = await adminDb
			.collection('sales')
			.orderBy('createdAt', 'desc')
			.get();
		const sales = salesSnap.docs.map(doc => {
			const data = doc.data();
			// Firestore Timestamps are not directly serializable to JSON for the client.
			// Convert them to a serializable format like ISO string or Unix timestamp.
			return {
				id: doc.id,
				...data,
				createdAt: data.createdAt.toDate(),
			};
		});
		return NextResponse.json(sales);
	} catch (err) {
		console.error('Error fetching sales data:', err);
		return NextResponse.json(
			{
				error: 'Failed to fetch sales data.',
			},
			{ status: 500 },
		);
	}
}
