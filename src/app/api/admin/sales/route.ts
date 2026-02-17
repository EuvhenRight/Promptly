import { adminDb } from '@/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'
import type { SaleRecord, UserProfile, Prompt } from '@/lib/types'
import admin, { firestore } from 'firebase-admin'
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

			// Total Revenue only counts real money (EUR) transactions
			if (sale.currency === 'eur') {
				totalRevenueEur += sale.revenueDetails.gross / 100
			}
			
			// Platform Earnings includes all platform fees, converted to EUR equivalent
			// For 'eur' transactions (credits/subs), the platformFee is the gross amount in cents.
			// For 'crd' transactions (prompt purchases), the platformFee is in credits.
			// We assume 100 credits = 1 EUR.
			const feeInCentsOrCredits = sale.revenueDetails.platformFee;
			platformEarningsEur += feeInCentsOrCredits / 100;


			if (sale.currency === 'eur') {
				let key: string
				if (period === '1d') {
					key = format(startOfHour(createdAtDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
				} else if (period === 'all') {
					key = format(startOfMonth(createdAtDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
				} else {
					key = format(startOfDay(createdAtDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
				}
				const grossInEur = sale.revenueDetails.gross / 100;
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

		// --- Process Top Products for the period ---
		const promptsById = new Map<string, { title: string }>()
		const promptIdsToFetch = new Set<string>()
		salesSnap.docs.forEach(doc => {
			const sale = doc.data() as SaleRecord
			if (sale.promptIds && sale.promptIds.length > 0) {
				sale.promptIds.forEach(id => promptIdsToFetch.add(id))
			}
		})

		if (promptIdsToFetch.size > 0) {
			const ids = Array.from(promptIdsToFetch)
			const chunks: string[][] = []
			for (let i = 0; i < ids.length; i += 30) {
				chunks.push(ids.slice(i, i + 30))
			}
			for (const chunk of chunks) {
				const promptsSnap = await adminDb.collection('prompts').where(firestore.FieldPath.documentId(), 'in', chunk).get()
				promptsSnap.forEach(doc => {
					promptsById.set(doc.id, { title: (doc.data() as Prompt).title })
				})
			}
		}

		const productStats = new Map<string, { salesCount: number; totalRevenue: number; name: string; type: 'prompt' | 'credits' | 'subscription' }>()
		salesSnap.docs.forEach(doc => {
			const sale = doc.data() as SaleRecord
			const revenue = sale.currency === 'eur' ? sale.revenueDetails.gross / 100 : 0
		
			if (sale.type === 'prompt' || sale.type === 'cart') {
				sale.promptIds?.forEach(id => {
					const key = `prompt-${id}`;
					const existing = productStats.get(key) || { salesCount: 0, totalRevenue: 0, name: promptsById.get(id)?.title || 'Unknown Prompt', type: 'prompt' };
					existing.salesCount += 1;
					existing.totalRevenue += revenue; // This assumes each item in cart has its own sale record with correct revenue
					productStats.set(key, existing);
				});
			} else if (sale.type === 'credits') {
				const creditsAmount = sale.creditsAmount
				if (creditsAmount) {
					const key = `credits-${creditsAmount}`
					const existing =
						productStats.get(key) || {
							salesCount: 0,
							totalRevenue: 0,
							name: `${creditsAmount} Credits`,
							type: 'credits',
						}
					existing.salesCount += 1
					existing.totalRevenue += revenue
					productStats.set(key, existing)
				}
			} else if (sale.type === 'subscription') {
				const plan = sale.plan ?? 'starter'
				const billing = sale.billing ?? 'monthly'
				const planName = plan === 'pro' ? 'PRO Plan' : 'Starter Plan'
				const key = `sub-${plan}-${billing}`
				const existing =
					productStats.get(key) || {
						salesCount: 0,
						totalRevenue: 0,
						name: `${planName} (${billing})`,
						type: 'subscription',
					}
				existing.salesCount += 1
				existing.totalRevenue += revenue
				productStats.set(key, existing)
			}
		});
		
		const topProducts = Array.from(productStats.entries())
			.map(([id, stats]) => ({ id, ...stats }))
			.sort((a, b) => b.totalRevenue - a.totalRevenue)
			.slice(0, 10);

		return NextResponse.json({
			stats: periodStats,
			sales,
			revenueChartData: formattedChartData,
			topSellers,
			topProducts,
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
