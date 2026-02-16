import { adminDb } from '@/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'
import type { SaleRecord, UserProfile, Prompt } from '@/lib/types'
import { Timestamp } from 'firebase-admin/firestore'
import {
	subDays,
	subHours,
	startOfHour,
	startOfDay,
	startOfMonth,
	format,
} from 'date-fns'

export async function GET(request: NextRequest) {
	if (!adminDb) {
		return NextResponse.json(
			{ error: 'Firebase Admin not initialized' },
			{ status: 503 },
		)
	}

	try {
		const { searchParams } = request.nextUrl
		const period = searchParams.get('period') || '30d' // '1d', '7d', '30d', 'all'

		let startDate: Date
		switch (period) {
			case '1d':
				startDate = subHours(new Date(), 24)
				break
			case '7d':
				startDate = subDays(new Date(), 7)
				break
			case 'all':
				startDate = new Date(0) // Epoch start for all-time data
				break
			case '30d':
			default:
				startDate = subDays(new Date(), 30)
				break
		}

		// --- Fetch data for the selected period ---
		let salesQuery = adminDb.collection('sales').orderBy('createdAt', 'desc')
		if (period !== 'all') {
			salesQuery = salesQuery.where('createdAt', '>=', Timestamp.fromDate(startDate))
		}
		const salesSnap = await salesQuery.get()

		// --- Fetch all users and prompts needed for enrichment and Top Sellers ---
		// Top Sellers should always be all-time, so we fetch all sales and prompts for that.
		const [allUsersSnap, allPromptsSnap, allSalesForSellersSnap] =
			await Promise.all([
				adminDb.collection('users').get(),
				adminDb.collection('prompts').get(),
				adminDb.collection('sales').get(), // For all-time seller stats
			])

		const usersById = new Map<string, UserProfile>()
		allUsersSnap.forEach(doc => {
			usersById.set(doc.id, doc.data() as UserProfile)
		})

		const promptsByAuthor = new Map<string, number>()
		allPromptsSnap.docs.forEach(doc => {
			const authorId = (doc.data() as Prompt).authorId
			if (authorId) {
				promptsByAuthor.set(authorId, (promptsByAuthor.get(authorId) || 0) + 1)
			}
		})

		// --- Process period-specific stats ---
		let totalRevenueEur = 0
		let platformEarningsEur = 0
		let promptSalesCount = 0
		const revenueChartData: { [key: string]: number } = {}

		const sales: any[] = []
		salesSnap.docs.forEach(doc => {
			const sale = doc.data() as SaleRecord
			const createdAtDate = (sale.createdAt as Timestamp).toDate()

			if (sale.currency === 'eur') {
				const grossInEur = sale.revenueDetails.gross / 100
				totalRevenueEur += grossInEur
				platformEarningsEur += sale.revenueDetails.platformFee / 100

				let key: string
				if (period === '1d') {
					key = format(startOfHour(createdAtDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
				} else if (period === 'all') {
					key = format(startOfMonth(createdAtDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
				} else {
					key = format(startOfDay(createdAtDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
				}
				revenueChartData[key] = (revenueChartData[key] || 0) + grossInEur
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
				createdAt: createdAtDate.toISOString(), // Use ISO string for client
			})
		})

		// --- Process All-Time Top Sellers ---
		const sellerStats = new Map<string, { salesCount: number; totalEarnings: number }>()
		allSalesForSellersSnap.docs.forEach(doc => {
			const sale = doc.data() as SaleRecord
			if (sale.sellerId) {
				const current = sellerStats.get(sale.sellerId) || {
					salesCount: 0,
					totalEarnings: 0,
				}
				current.salesCount += 1
				// Seller earning is always in credits, regardless of purchase currency
				current.totalEarnings += sale.revenueDetails.sellerEarning
				sellerStats.set(sale.sellerId, current)
			}
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

		const periodStats = {
			totalRevenue: totalRevenueEur,
			platformEarnings: platformEarningsEur,
			totalSalesCount: sales.length,
			promptSalesCount: promptSalesCount,
		}

		const formattedChartData = Object.entries(revenueChartData)
			.map(([date, revenue]) => ({
				date,
				Revenue: revenue,
			}))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

		return NextResponse.json({
			stats: periodStats,
			sales,
			revenueChartData: formattedChartData,
			topSellers,
		})
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
