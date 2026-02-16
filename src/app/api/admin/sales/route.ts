import { adminDb } from '@/firebase/admin'
import { NextResponse } from 'next/server'
import type { SaleRecord, UserProfile } from '@/lib/types'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET() {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	try {
		const [salesSnap, usersSnap] = await Promise.all([
			adminDb.collection('sales').orderBy('createdAt', 'desc').get(),
			adminDb.collection('users').get(),
		])

		const usersById = new Map<string, UserProfile>()
		usersSnap.forEach(doc => {
			usersById.set(doc.id, doc.data() as UserProfile)
		})

		const sales: any[] = []
		let totalRevenueEur = 0
		let platformEarningsEur = 0
		let promptSalesCount = 0

		// For the chart
		const dailyRevenueData: { [date: string]: number } = {}
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

		salesSnap.docs.forEach(doc => {
			const sale = doc.data() as SaleRecord
			const createdAtDate = (sale.createdAt as Timestamp).toDate()

			// Aggregate stats
			if (sale.currency === 'eur') {
				totalRevenueEur += sale.revenueDetails.gross
				platformEarningsEur += sale.revenueDetails.platformFee

				// Process for daily revenue chart
				if (createdAtDate >= thirtyDaysAgo) {
					const dateString = createdAtDate.toISOString().split('T')[0] // YYYY-MM-DD
					dailyRevenueData[dateString] =
						(dailyRevenueData[dateString] || 0) + sale.revenueDetails.gross
				}
			}
			if (sale.type === 'prompt' || sale.type === 'cart') {
				promptSalesCount += sale.promptIds?.length ?? 1
			}

			// Enrich sales data for the table
			const buyer = usersById.get(sale.buyerId)
			const seller = sale.sellerId ? usersById.get(sale.sellerId) : undefined

			sales.push({
				...sale,
				id: doc.id,
				buyerDisplayName: buyer?.displayName ?? 'Unknown User',
				buyerPhotoURL: buyer?.photoURL ?? '',
				sellerDisplayName: seller?.displayName ?? 'Platform',
				sellerPhotoURL: seller?.photoURL ?? '',
				createdAt: createdAtDate, // Convert Timestamp to Date for JSON serialization
			})
		})

		const stats = {
			totalRevenue: totalRevenueEur / 100,
			platformEarnings: platformEarningsEur / 100,
			totalSalesCount: sales.length,
			promptSalesCount: promptSalesCount,
		}

		const dailyRevenue = Object.entries(dailyRevenueData)
			.map(([date, revenueCents]) => ({
				date,
				Revenue: revenueCents / 100,
			}))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

		return NextResponse.json({ stats, sales, dailyRevenue })
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
