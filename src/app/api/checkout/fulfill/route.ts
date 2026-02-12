import { adminDb } from '@/firebase/admin'
import { getStripe } from '@/lib/stripe'
import admin from 'firebase-admin'
import type Stripe from 'stripe'
import { NextRequest } from 'next/server'

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
	const ref = db.collection('users').doc(userId).collection('purchaseHistory').doc(sessionId)
	return ref.set({
		type,
		amountCents,
		currency: currency.toLowerCase(),
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
		...extra,
	}, { merge: true })
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
			return Response.json(
				{ error: 'Missing session_id' },
				{ status: 400 },
			)
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

		if (!adminDb) {
			return Response.json(
				{ success: true, granted: [], grantedCredits: 0, message: 'Server not configured.' },
				{ status: 200 },
			)
		}

		// Credits: add to user's wallet and write history
		if (type === 'credits' && userId) {
			const creditsAmount = parseInt(metadata.credits ?? '0', 10)
			if (creditsAmount > 0) {
				const userRef = adminDb.collection('users').doc(userId)
				await userRef.update({
					credits: admin.firestore.FieldValue.increment(creditsAmount),
				})
				await writePurchaseHistory(adminDb, userId, sessionId, session, 'credits', {
					creditsAmount,
					description: `${creditsAmount.toLocaleString()} credits`,
				})
				return Response.json(
					{ success: true, granted: [], grantedCredits: creditsAmount },
					{ status: 200 },
				)
			}
		}

		// Plan: only record history (no grant logic yet)
		if (type === 'plan' && userId) {
			const plan = metadata.plan ?? 'starter'
			const billing = metadata.billing ?? 'monthly'
			const planName = plan === 'pro' ? 'Promptly PRO' : 'Promptly Starter'
			await writePurchaseHistory(adminDb, userId, sessionId, session, 'plan', {
				plan,
				billing,
				description: `${planName} (${billing})`,
			})
			return Response.json(
				{ success: true, granted: [], grantedCredits: 0 },
				{ status: 200 },
			)
		}

		if (!userId) {
			return Response.json(
				{ success: true, granted: [], grantedCredits: 0, message: 'Nothing to fulfill.' },
				{ status: 200 },
			)
		}

		let promptIds: string[] = []
		if (type === 'prompt' && metadata.promptId) {
			promptIds = [metadata.promptId]
		} else if (type === 'cart' && metadata.promptIds) {
			promptIds = metadata.promptIds.split(',').map((id) => id.trim()).filter(Boolean)
		}

		if (promptIds.length === 0) {
			return Response.json({ success: true, granted: [], grantedCredits: 0 }, { status: 200 })
		}

		if (type !== 'prompt' && type !== 'cart') {
			return Response.json({ error: 'Invalid fulfillment type' }, { status: 400 });
		}

		const userRef = adminDb.collection('users').doc(userId)
		await userRef.update({
			purchasedPrompts: admin.firestore.FieldValue.arrayUnion(...promptIds),
		})

		// Fetch prompt titles for the history record (so the profile can show names as links)
		const promptTitles: string[] = []
		for (const pid of promptIds) {
			const snap = await adminDb.collection('prompts').doc(pid).get()
			promptTitles.push((snap.data()?.title as string) || 'Prompt')
		}
		const description =
			type === 'cart'
				? `Cart (${promptIds.length} prompt${promptIds.length === 1 ? '' : 's'})`
				: type === 'prompt'
					? '1 prompt'
					: undefined
		await writePurchaseHistory(adminDb, userId, sessionId, session, type, {
			promptIds,
			promptTitles,
			description,
		})

		// Remove purchased prompts from the user's active cart
		const cartRef = adminDb.collection('users').doc(userId).collection('carts').doc('active')
		const cartSnap = await cartRef.get()
		if (cartSnap.exists) {
			const data = cartSnap.data()
			const existingIds = (data?.promptIds as string[] | undefined) ?? []
			const remaining = existingIds.filter((id) => !promptIds.includes(id))
			if (remaining.length !== existingIds.length) {
				await cartRef.update({
					promptIds: remaining,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				})
			}
		}

		return Response.json({ success: true, granted: promptIds, grantedCredits: 0 }, { status: 200 })
	} catch (err) {
		console.error('Fulfill error:', err)
		return Response.json(
			{ error: err instanceof Error ? err.message : 'Fulfillment failed' },
			{ status: 500 },
		)
	}
}
