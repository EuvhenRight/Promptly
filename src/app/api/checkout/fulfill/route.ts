import { adminDb } from '@/firebase/admin'
import { getStripe } from '@/lib/stripe'
import admin from 'firebase-admin'
import type Stripe from 'stripe'
import { NextRequest } from 'next/server'
import type { Prompt, UserProfile, SaleRecord } from '@/lib/types'

const PLATFORM_COMMISSION_RATE = 0.20 // 20% platform fee

function writePurchaseHistory(
	db: admin.firestore.Firestore,
	userId: string,
	sessionId: string,
	session: Stripe.Checkout.Session,
	type: 'credits' | 'prompt' | 'cart' | 'plan',
	extra: {
		promptIds?: string[]
		promptTitles?: string[]
		creditsAmount?: number
		plan?: string
		billing?: string
		description?: string
	},
) {
	const amountCents = session.amount_total ?? 0
	const currency = (session.currency ?? 'usd').toUpperCase()
	const ref = db
		.collection('users')
		.doc(userId)
		.collection('purchaseHistory')
		.doc(sessionId)
	return ref.set(
		{
			type,
			amountCents,
			currency: currency.toLowerCase(),
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			...extra,
		},
		{ merge: true },
	)
}

/**
 * After successful Stripe checkout, grant the purchase (prompts/credits) and
 * write a purchase history record. Idempotent: safe to call multiple times.
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}))
		const sessionId =
			(typeof body.session_id === 'string' ? body.session_id : null) ||
			req.nextUrl.searchParams.get('session_id')

		if (!sessionId) {
			return Response.json({ error: 'Missing session_id' }, { status: 400 })
		}

		const stripe = await getStripe()
		const session = await stripe.checkout.sessions.retrieve(sessionId)

		if (session.status !== 'complete') {
			return Response.json(
				{ error: 'Payment not complete', status: session.status },
				{ status: 400 },
			)
		}

		const metadata = (session.metadata ?? {}) as Record<string, string>
		const type = metadata.type
		const userId = metadata.userId
		const amountTotal = session.amount_total

		if (!adminDb) {
			return Response.json(
				{
					success: true,
					granted: [],
					grantedCredits: 0,
					message: 'Server not configured.',
				},
				{ status: 200 },
			)
		}

		// Credits: add to user's wallet and write history
		if (type === 'credits' && userId && amountTotal) {
			const creditsAmount = parseInt(metadata.credits ?? '0', 10)
			if (creditsAmount > 0) {
				const userRef = adminDb!.collection('users').doc(userId)
				const salesRef = adminDb!.collection('sales').doc(sessionId)

				const batch = adminDb!.batch()
				batch.update(userRef, {
					credits: admin.firestore.FieldValue.increment(creditsAmount),
				})
				batch.set(salesRef, {
					type: 'credits',
					status: 'completed',
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
					buyerId: userId,
					sellerId: null, // Platform sale
					promptIds: [],
					creditsAmount: creditsAmount,
					revenueDetails: {
						gross: amountTotal, // in cents
						platformFee: amountTotal, // All revenue is platform fee
						sellerEarning: 0,
					},
					currency: session.currency,
					paymentMethod: 'stripe',
				})
				await batch.commit()

				await writePurchaseHistory(
					adminDb!,
					userId,
					sessionId,
					session,
					'credits',
					{
						creditsAmount,
						description: `${creditsAmount.toLocaleString()} credits`,
					},
				)
				return Response.json(
					{ success: true, granted: [], grantedCredits: creditsAmount },
					{ status: 200 },
				)
			}
		}

		// Plan: grant credits and update user plan
		if (type === 'plan' && userId && amountTotal) {
			const plan = metadata.plan ?? 'starter'
			const billing = metadata.billing ?? 'monthly'
			const planName = plan === 'pro' ? 'Promptly PRO' : 'Promptly Starter'
			const creditsAmount = plan === 'pro' ? 7200 : 3600

			const batch = adminDb!.batch()
			const userRef = adminDb!.collection('users').doc(userId)
			const publicProfileRef = adminDb!
				.collection('public-profiles')
				.doc(userId)
			const salesRef = adminDb!.collection('sales').doc(sessionId)

			batch.update(userRef, {
				planId: plan,
				credits: admin.firestore.FieldValue.increment(creditsAmount),
				planPurchasedAt: admin.firestore.FieldValue.serverTimestamp(),
				planBillingPeriod: billing,
				planWillCancelAtPeriodEnd: false,
			})
			batch.update(publicProfileRef, { planId: plan })
			batch.set(salesRef, {
				type: 'subscription',
				status: 'completed',
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				buyerId: userId,
				sellerId: null,
				promptIds: [],
				plan: plan,
				billing: billing,
				revenueDetails: {
					gross: amountTotal,
					platformFee: amountTotal,
					sellerEarning: 0,
				},
				currency: session.currency,
				paymentMethod: 'stripe',
			})

			await batch.commit()

			await writePurchaseHistory(adminDb!, userId, sessionId, session, 'plan', {
				plan,
				billing,
				creditsAmount,
				description: `${planName} (${billing})`,
			})
			return Response.json(
				{ success: true, granted: [], grantedCredits: creditsAmount },
				{ status: 200 },
			)
		}

		if (!userId) {
			return Response.json(
				{
					success: true,
					granted: [],
					grantedCredits: 0,
					message: 'Nothing to fulfill.',
				},
				{ status: 200 },
			)
		}

		let promptIds: string[] = []
		let promptTitles: string[] = []
		if (type === 'prompt' && metadata.promptId) {
			promptIds = [metadata.promptId]
		} else if (type === 'cart' && metadata.promptIds) {
			promptIds = metadata.promptIds
				.split(',')
				.map(id => id.trim())
				.filter(Boolean)
		}

		if (promptIds.length > 0 && amountTotal) {
			await adminDb!.runTransaction(async transaction => {
				const userRef = adminDb!.collection('users').doc(userId)
				transaction.update(userRef, {
					purchasedPrompts: admin.firestore.FieldValue.arrayUnion(...promptIds),
				})

				const promptRefs = promptIds.map(id =>
					adminDb!.collection('prompts').doc(id),
				)
				const promptDocs = await adminDb!.getAll(...promptRefs)

				for (const doc of promptDocs) {
					if (doc.exists) {
						const promptData = doc.data() as Prompt
						promptTitles.push(promptData.title || 'Prompt')
						const sellerId = promptData.authorId
						const priceInCents = Math.round(promptData.price * 100)

						const saleRef = adminDb!.collection('sales').doc()
						const sellerEarning = Math.floor(
							priceInCents * (1 - PLATFORM_COMMISSION_RATE),
						)
						const platformFee = priceInCents - sellerEarning

						transaction.set(saleRef, {
							type: 'prompt',
							status: 'completed',
							createdAt: admin.firestore.FieldValue.serverTimestamp(),
							buyerId: userId,
							sellerId: sellerId,
							promptIds: [doc.id],
							revenueDetails: {
								gross: priceInCents,
								platformFee,
								sellerEarning,
							},
							currency: session.currency,
							paymentMethod: 'stripe',
						})
						transaction.update(doc.ref, {
							'stats.sales': admin.firestore.FieldValue.increment(1),
						})
						if (sellerId && sellerId !== userId) {
							const sellerRef = adminDb!.collection('users').doc(sellerId)
							transaction.update(sellerRef, {
								credits: admin.firestore.FieldValue.increment(sellerEarning),
								earnings: admin.firestore.FieldValue.increment(sellerEarning),
							})
							const notificationRef = adminDb!
								.collection('users')
								.doc(sellerId)
								.collection('notifications')
								.doc()
							transaction.set(notificationRef, {
								type: 'sale',
								title: 'Prompt Sold!',
								body: `Your prompt "${promptData.title}" sold! You earned ${sellerEarning} credits.`,
								link: `/prompt/${doc.id}`,
								isRead: false,
								createdAt: admin.firestore.FieldValue.serverTimestamp(),
								userId: sellerId,
							})
						}
					}
				}
			})
		} else {
			return Response.json(
				{ success: true, granted: [], grantedCredits: 0 },
				{ status: 200 },
			)
		}

		// Write to user's personal history
		await writePurchaseHistory(adminDb!, userId, sessionId, session, type as 'prompt' | 'cart', {
			promptIds,
			promptTitles,
		})

		// Remove purchased prompts from the user's active cart
		const cartRef = adminDb!
			.collection('users')
			.doc(userId)
			.collection('carts')
			.doc('active')
		const cartSnap = await cartRef.get()
		if (cartSnap.exists) {
			const data = cartSnap.data()
			const existingIds = (data?.promptIds as string[] | undefined) ?? []
			const remaining = existingIds.filter(id => !promptIds.includes(id))
			if (remaining.length !== existingIds.length) {
				await cartRef.update({
					promptIds: remaining,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				})
			}
		}

		return Response.json(
			{ success: true, granted: promptIds, grantedCredits: 0 },
			{ status: 200 },
		)
	} catch (err) {
		console.error('Fulfill error:', err)
		return Response.json(
			{ error: err instanceof Error ? err.message : 'Fulfillment failed' },
			{ status: 500 },
		)
	}
}
