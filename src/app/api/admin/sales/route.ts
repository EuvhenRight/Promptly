import { adminDb } from '@/firebase/admin'
import { NextResponse } from 'next/server'
import type { SaleRecord, UserProfile } from '@/lib/types'

export async function GET() {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	try {
		// Fetch all sales and all users in parallel
		const [salesSnap, usersSnap] = await Promise.all([
			adminDb.collection('sales').orderBy('createdAt', 'desc').get(),
			adminDb.collection('users').get(),
		])

		const usersById = new Map<string, UserProfile>()
		usersSnap.forEach(doc => {
			usersById.set(doc.id, doc.data() as UserProfile)
		})

		const sales: Omit<SaleRecord, 'createdAt'>[] = []
		let totalRevenueEur = 0
		let platformEarningsEur = 0
		let promptSalesCount = 0

		salesSnap.docs.forEach(doc => {
			const sale = doc.data() as SaleRecord
			const buyer = usersById.get(sale.buyerId)
			const seller = sale.sellerId ? usersById.get(sale.sellerId) : undefined

			sales.push({
				id: doc.id,
				...sale,
				// Add enriched data
				buyerDisplayName: buyer?.displayName ?? 'Unknown User',
				buyerPhotoURL: buyer?.photoURL ?? '',
				sellerDisplayName: seller?.displayName ?? 'Platform',
				sellerPhotoURL: seller?.photoURL ?? '',
				createdAt: (sale.createdAt as any).toDate(), // Convert Timestamp to Date for JSON serialization
			})

			if (sale.currency === 'eur') {
				totalRevenueEur += sale.revenueDetails.gross
				platformEarningsEur += sale.revenueDetails.platformFee
			}
			if (sale.type === 'prompt' || sale.type === 'cart') {
				promptSalesCount += sale.promptIds?.length ?? 1
			}
		})

		const stats = {
			totalRevenue: totalRevenueEur / 100, // Convert cents to EUR
			platformEarnings: platformEarningsEur / 100,
			totalSalesCount: sales.length,
			promptSalesCount: promptSalesCount,
		}

		return NextResponse.json({ stats, sales })
	} catch (err) {
		console.error('Error fetching sales data:', err)
		return NextResponse.json(
			{
				error: 'Failed to fetch sales data.',
			},
			{ status: 500 },
		)
	}
}
