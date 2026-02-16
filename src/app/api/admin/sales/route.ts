import { adminDb } from '@/firebase/admin'
import { NextResponse } from 'next/server'
import type { SaleRecord, UserProfile, Prompt } from '@/lib/types'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET() {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}
	try {
		const [salesSnap, usersSnap, promptsSnap] = await Promise.all([
			adminDb.collection('sales').orderBy('createdAt', 'desc').get(),
			adminDb.collection('users').get(),
			adminDb.collection('prompts').get(),
		])

		const usersById = new Map<string, UserProfile>()
		usersSnap.forEach(doc => {
			usersById.set(doc.id, doc.data() as UserProfile)
		})

		const promptsByAuthor = new Map<string, number>()
		promptsSnap.docs.forEach(doc => {
			const authorId = (doc.data() as Prompt).authorId
			if (authorId) {
				promptsByAuthor.set(authorId, (promptsByAuthor.get(authorId) || 0) + 1)
			}
		})

		const sales: any[] = []
		let totalRevenueEur = 0
		let platformEarningsEur = 0
		let promptSalesCount = 0

		const dailyRevenueData: { [date: string]: number } = {}
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

		const sellerStats = new Map<string, { salesCount: number; totalEarnings: number }>()

		salesSnap.docs.forEach(doc => {
			const sale = doc.data() as SaleRecord
			const createdAtDate = (sale.createdAt as Timestamp).toDate()

			if (sale.currency === 'eur') {
				totalRevenueEur += sale.revenueDetails.gross
				platformEarningsEur += sale.revenueDetails.platformFee
				if (createdAtDate >= thirtyDaysAgo) {
					const dateString = createdAtDate.toISOString().split('T')[0]
					dailyRevenueData[dateString] =
						(dailyRevenueData[dateString] || 0) + sale.revenueDetails.gross
				}
			}

			if (sale.sellerId) {
				const current = sellerStats.get(sale.sellerId) || { salesCount: 0, totalEarnings: 0 };
				current.salesCount += 1;
				// Seller earning is always in credits, regardless of purchase currency
				current.totalEarnings += sale.revenueDetails.sellerEarning;
				sellerStats.set(sale.sellerId, current);
			}

			if (sale.type === 'prompt' || sale.type === 'cart') {
				promptSalesCount += sale.promptIds?.length ?? 1
			}

			const buyer = usersById.get(sale.buyerId)
			const seller = sale.sellerId ? usersById.get(sale.sellerId) : undefined
			sales.push({
				...sale,
				id: doc.id,
				buyerDisplayName: buyer?.displayName ?? 'Unknown User',
				buyerPhotoURL: buyer?.photoURL ?? '',
				sellerDisplayName: seller?.displayName ?? 'Platform',
				sellerPhotoURL: seller?.photoURL ?? '',
				createdAt: createdAtDate,
			})
		})

		const topSellers: any[] = []
		sellerStats.forEach((stats, userId) => {
			const user = usersById.get(userId)
			if (user) {
				topSellers.push({
					userId: userId,
					displayName: user.displayName,
					photoURL: user.photoURL,
					salesCount: stats.salesCount,
					totalEarnings: stats.totalEarnings / 100, // Convert credits to EUR
					promptsCount: promptsByAuthor.get(userId) || 0,
				})
			}
		})
		topSellers.sort((a, b) => b.totalEarnings - a.totalEarnings)

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

		return NextResponse.json({ stats, sales, dailyRevenue, topSellers })
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
