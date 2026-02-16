
import { adminDb } from '@/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { getAuth as getAdminAuth } from 'firebase-admin/auth'
import type { Prompt, UserProfile } from '@/lib/types'

const PLATFORM_COMMISSION_RATE = 0.2 // 20% platform fee

async function handleSinglePromptPurchase(
	userId: string,
	promptId: string,
): Promise<NextResponse> {
	const db = adminDb
	if (!db) {
		return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
	}

	let creditPrice: number
	let promptData: any

	await db.runTransaction(async transaction => {
		const userRef = db.doc(`users/${userId}`)
		const promptRef = db.doc(`prompts/${promptId}`)
		const [userDoc, promptDoc] = await Promise.all([
			transaction.get(userRef),
			transaction.get(promptRef),
		])

		if (!userDoc.exists) throw new Error('User not found.')
		if (!promptDoc.exists) throw new Error('Prompt not found.')

		const userData = userDoc.data() as UserProfile
		promptData = promptDoc.data() as Prompt

		if (userData.purchasedPrompts?.includes(promptId)) {
			return // User already owns this prompt, transaction succeeds silently
		}

		creditPrice = Math.round(promptData.price * 100)
		const userTotalCredits = userData.credits ?? 0

		if (userTotalCredits < creditPrice) {
			throw new Error('Insufficient credits.')
		}

		// Deduct from the user's total credit balance
		transaction.update(userRef, {
			purchasedPrompts: admin.firestore.FieldValue.arrayUnion(promptId),
			credits: admin.firestore.FieldValue.increment(-creditPrice),
		})

		const authorId = promptData.authorId
		if (authorId && authorId !== userId) {
			const earningsAmount = Math.floor(
				creditPrice * (1 - PLATFORM_COMMISSION_RATE),
			)
			const authorRef = db.doc(`users/${authorId}`)
			// Increment both credits and earnings for the author
			transaction.update(authorRef, {
				credits: admin.firestore.FieldValue.increment(earningsAmount),
				earnings: admin.firestore.FieldValue.increment(earningsAmount),
			})
			const notificationRef = db
				.collection('users')
				.doc(authorId)
				.collection('notifications')
				.doc()
			transaction.set(notificationRef, {
				type: 'sale',
				title: 'Prompt Sold!',
				body: `Your prompt "${promptData.title}" earned you ${earningsAmount} credits.`,
				link: `/prompt/${promptId}`,
				isRead: false,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				userId: authorId,
			})
		}

		transaction.update(promptRef, {
			'stats.sales': admin.firestore.FieldValue.increment(1),
		})

		// Create the sale document
		const saleRef = db.collection('sales').doc()
		const earningsAmount = Math.floor(
			creditPrice * (1 - PLATFORM_COMMISSION_RATE),
		)
		const commission = creditPrice - earningsAmount

		transaction.set(saleRef, {
			type: 'prompt',
			status: 'completed',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			buyerId: userId,
			sellerId: promptData.authorId,
			promptIds: [promptId],
			revenueDetails: {
				gross: creditPrice, // Gross is in credits
				platformFee: commission,
				sellerEarning: earningsAmount,
			},
			currency: 'crd',
			paymentMethod: 'credits',
		})
	})

	if (promptData) {
		const historyRef = db
			.collection('users')
			.doc(userId)
			.collection('purchaseHistory')
			.doc()
		await historyRef.set({
			type: 'prompt',
			amountCents: creditPrice!,
			currency: 'crd',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			promptIds: [promptId],
			promptTitles: [promptData.title],
			description: promptData.title,
		})
	}

	return NextResponse.json({ success: true })
}

async function handleCartPurchase(
	userId: string,
	promptIds: string[],
): Promise<NextResponse> {
	const db = adminDb
	if (!db) {
		return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
	}

	let totalCreditCost = 0
	const promptDetails: { id: string; title: string }[] = []

	await db.runTransaction(async transaction => {
		const userRef = db.doc(`users/${userId}`)
		const cartRef = db.collection('users').doc(userId).collection('carts').doc('active')
		const userDoc = await transaction.get(userRef)
		if (!userDoc.exists) throw new Error('User not found.')
		const userData = userDoc.data() as UserProfile

		const promptRefs = promptIds.map(id => db.doc(`prompts/${id}`))
		const promptDocs = await transaction.getAll(...promptRefs)

		let calculatedTotalCost = 0

		for (const pDoc of promptDocs) {
			if (!pDoc.exists) throw new Error(`Prompt with ID ${pDoc.id} not found.`)
			const pData = pDoc.data()!
			const creditPrice = Math.round(pData.price * 100)

			calculatedTotalCost += creditPrice
			promptDetails.push({ id: pDoc.id, title: pData.title })

			// Update prompt sales stat
			transaction.update(pDoc.ref, {
				'stats.sales': admin.firestore.FieldValue.increment(1),
			})

			// Handle author earnings
			const authorId = pData.authorId
			if (authorId && authorId !== userId) {
				const earningsAmount = Math.floor(
					creditPrice * (1 - PLATFORM_COMMISSION_RATE),
				)
				const authorRef = db.doc(`users/${authorId}`)
				transaction.update(authorRef, {
					credits: admin.firestore.FieldValue.increment(earningsAmount),
					earnings: admin.firestore.FieldValue.increment(earningsAmount),
				})

				// Create a notification for the author
				const notificationRef = db
					.collection('users')
					.doc(authorId)
					.collection('notifications')
					.doc()
				transaction.set(notificationRef, {
					type: 'sale',
					title: 'Prompt Sold!',
					body: `You earned ${earningsAmount} credits from the sale of "${pData.title}".`,
					link: `/prompt/${pDoc.id}`,
					isRead: false,
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
					userId: authorId,
				})
			}

			// Create a sale record for each item
			const saleRef = db.collection('sales').doc()
			const sellerEarning = Math.floor(
				creditPrice * (1 - PLATFORM_COMMISSION_RATE),
			)
			const platformFee = creditPrice - sellerEarning
			transaction.set(saleRef, {
				type: 'prompt',
				status: 'completed',
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				buyerId: userId,
				sellerId: authorId,
				promptIds: [pDoc.id],
				revenueDetails: {
					gross: creditPrice,
					platformFee: platformFee,
					sellerEarning: sellerEarning,
				},
				currency: 'crd',
				paymentMethod: 'credits',
			})
		}

		totalCreditCost = calculatedTotalCost
		const userTotalCredits = userData.credits ?? 0
		if (userTotalCredits < totalCreditCost) {
			throw new Error('Insufficient credits.')
		}

		// Update buyer's profile
		transaction.update(userRef, {
			purchasedPrompts: admin.firestore.FieldValue.arrayUnion(...promptIds),
			credits: admin.firestore.FieldValue.increment(-totalCreditCost),
		})

		// Clear cart
		transaction.update(cartRef, { promptIds: [] })
	})

	// Write to purchase history (outside transaction)
	const historyRef = db
		.collection('users')
		.doc(userId)
		.collection('purchaseHistory')
		.doc()
	await historyRef.set({
		type: 'cart',
		amountCents: totalCreditCost,
		currency: 'crd',
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
		promptIds: promptIds,
		promptTitles: promptDetails.map(d => d.title),
		description: `${promptIds.length} prompts from cart`,
	})

	return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
	try {
		const token = req.headers.get('Authorization')?.split('Bearer ')[1]
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const adminAuth = getAdminAuth()
		if (!adminAuth) {
			return NextResponse.json(
				{ error: 'Server auth not configured' },
				{ status: 500 },
			)
		}
		const decodedToken = await adminAuth.verifyIdToken(token)
		const userId = decodedToken.uid

		const body = await req.json()
		const { promptId, promptIds, type } = body

		if (type === 'cart' && Array.isArray(promptIds) && promptIds.length > 0) {
			return await handleCartPurchase(userId, promptIds)
		} else if (promptId) {
			return await handleSinglePromptPurchase(userId, promptId)
		} else {
			return NextResponse.json(
				{ error: 'Invalid request body' },
				{ status: 400 },
			)
		}
	} catch (error: any) {
		console.error('Purchase transaction failed:', error)
		return NextResponse.json(
			{ error: error.message || 'An internal error occurred.' },
			{ status: 400 },
		)
	}
}
