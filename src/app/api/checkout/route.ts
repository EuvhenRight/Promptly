import { adminDb } from '@/firebase/admin'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'

function getStripe(): Stripe {
	const key = process.env.STRIPE_SECRET_KEY
	if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
	return new Stripe(key)
}

/** Stripe currency (e.g. 'usd', 'eur'). Minimum charge is 0.50 in that currency. */
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase()
const MIN_AMOUNT_CENTS = 50 // Stripe minimum 0.50 in the currency's smallest unit

function getOrigin(req: NextRequest): string {
	if (process.env.DOMAIN) return process.env.DOMAIN.replace(/\/$/, '')
	const origin = req.headers.get('origin') || req.headers.get('referer')
	if (origin) {
		try {
			const u = new URL(origin)
			return u.origin
		} catch {
			// fallback
		}
	}
	return process.env.VERCEL_URL
		? `https://${process.env.VERCEL_URL}`
		: 'http://localhost:9002'
}

type CheckoutBody = {
	promptId?: string
	title?: string
	price?: number
	description?: string
	image?: string
}

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as CheckoutBody
		const {
			promptId,
			title: bodyTitle,
			price: bodyPrice,
			description: bodyDesc,
			image: bodyImage,
		} = body

		if (!promptId) {
			return Response.json({ error: 'Missing promptId' }, { status: 400 })
		}

		let title: string
		let description: string
		let amountCents: number
		let image: string | undefined

		if (adminDb) {
			const promptSnap = await adminDb.collection('prompts').doc(promptId).get()
			if (!promptSnap.exists) {
				return Response.json({ error: 'Prompt not found' }, { status: 404 })
			}
			const data = promptSnap.data()!
			title = (data.title as string) || 'Prompt'
			description = (data.description as string) || ''
			const price = Number(data.price)
			amountCents = Math.round((Number.isFinite(price) ? price : 0) * 100)
			image =
				Array.isArray(data.images) && data.images[0]
					? data.images[0]
					: undefined
		} else {
			// Firebase Admin not available: accept prompt details in the request body.
			// Required: title, price. Optional: description, image.
			// If missing or invalid (price < $0.50), return 503.
			if (bodyTitle == null || bodyTitle === '' || bodyPrice == null) {
				return Response.json(
					{
						error:
							'Firebase Admin not available. Add service-account.json to the project root, or send prompt details (title, price, and optionally description, image) in the request body.',
					},
					{ status: 503 },
				)
			}
			title = String(bodyTitle).trim() || 'Prompt'
			description = bodyDesc != null ? String(bodyDesc) : ''
			const price = Number(bodyPrice)
			amountCents = Math.round((Number.isFinite(price) ? price : 0) * 100)
			image = bodyImage ? String(bodyImage) : undefined
		}

		const minLabel = STRIPE_CURRENCY === 'eur' ? '€0.50' : '$0.50'
		if (amountCents < MIN_AMOUNT_CENTS) {
			return Response.json(
				{ error: `Invalid price (minimum ${minLabel})` },
				{ status: 400 },
			)
		}

		const origin = getOrigin(req)
		const stripe = getStripe()
		const session = await stripe.checkout.sessions.create({
			ui_mode: 'embedded',
			mode: 'payment',
			line_items: [
				{
					price_data: {
						currency: STRIPE_CURRENCY,
						product_data: {
							name: title,
							description: description.slice(0, 500) || undefined,
							images: image ? [image] : undefined,
						},
						unit_amount: amountCents,
					},
					quantity: 1,
				},
			],
			return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}&promptId=${encodeURIComponent(promptId)}`,
			metadata: { promptId },
		})

		return Response.json({ clientSecret: session.client_secret })
	} catch (err) {
		console.error('Checkout session error:', err)
		return Response.json(
			{ error: err instanceof Error ? err.message : 'Checkout failed' },
			{ status: 500 },
		)
	}
}
