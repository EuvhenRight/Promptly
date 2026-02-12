import { adminDb } from '@/firebase/admin'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

let stripeSecretKey: string | null = null
const secretName =
	'projects/studio-2725546260-fde38/secrets/STRIPE_SECRET_KEY/versions/latest'

async function getStripeSecretKey(): Promise<string> {
	if (stripeSecretKey) {
		return stripeSecretKey
	}

	// For local dev, use .env file. For production, this will be undefined.
	if (process.env.STRIPE_SECRET_KEY) {
		stripeSecretKey = process.env.STRIPE_SECRET_KEY
		return stripeSecretKey
	}

	// For production on App Hosting, fetch from Secret Manager.
	try {
		const client = new SecretManagerServiceClient()
		const [version] = await client.accessSecretVersion({ name: secretName })
		const payload = version.payload?.data?.toString()
		if (!payload) {
			throw new Error(`Secret payload is empty for ${secretName}.`)
		}
		stripeSecretKey = payload
		return stripeSecretKey
	} catch (error) {
		console.error('Failed to access secret from Secret Manager:', error)
		throw new Error(
			`STRIPE_SECRET_KEY could not be loaded. Ensure the App Hosting backend service account has the 'Secret Manager Secret Accessor' role for the secret.`,
		)
	}
}

async function getStripe(): Promise<Stripe> {
	const key = await getStripeSecretKey()
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

/** Plan prices in main unit (e.g. 296 = 296 EUR/USD). Yearly = per year total. */
const PLAN_PRICES = {
	starter: { monthly: 10, yearly: 108 },
	pro: { monthly: 22, yearly: 296 },
} as const

/** Credits pack prices in main unit. */
const CREDITS_PRICES: Record<number, number> = {
	1000: 10,
	2000: 18,
}

type CheckoutBody = {
	type?: 'prompt' | 'credits' | 'plan' | 'cart'
	promptId?: string
	promptIds?: string[]
	title?: string
	price?: number
	description?: string
	image?: string
	credits?: number
	plan?: 'starter' | 'pro'
	billing?: 'monthly' | 'yearly'
}

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as CheckoutBody
		const type =
			body.type ??
			(body.promptIds?.length ? 'cart' : body.promptId ? 'prompt' : undefined)
		const {
			promptId,
			promptIds: bodyPromptIds,
			title: bodyTitle,
			price: bodyPrice,
			description: bodyDesc,
			image: bodyImage,
			credits: bodyCredits,
			plan: bodyPlan,
			billing: bodyBilling,
		} = body

		let title: string
		let description: string
		let amountCents: number
		let image: string | undefined
		let metadata: Record<string, string> = {}
		let line_items: Stripe.Checkout.SessionCreateParams['line_items'] = []

		if (type === 'cart' && Array.isArray(bodyPromptIds) && bodyPromptIds.length > 0) {
			if (!adminDb) {
				return Response.json(
					{ error: 'Cart checkout requires server configuration.' },
					{ status: 503 },
				)
			}
			metadata = { type: 'cart', promptIds: bodyPromptIds.join(',') }
			let totalCents = 0
			const items: Stripe.Checkout.SessionCreateParams['line_items'] = []
			for (const pid of bodyPromptIds) {
				const promptSnap = await adminDb.collection('prompts').doc(pid).get()
				if (!promptSnap.exists) continue
				const data = promptSnap.data()!
				const price = Number(data.price)
				const itemCents = Math.round((Number.isFinite(price) ? price : 0) * 100)
				if (itemCents < MIN_AMOUNT_CENTS) continue // skip free or invalid
				totalCents += itemCents
				items.push({
					price_data: {
						currency: STRIPE_CURRENCY,
						product_data: {
							name: (data.title as string) || 'Prompt',
							description:
								(data.description as string)?.slice(0, 500) || undefined,
							images:
								Array.isArray(data.images) && data.images[0]
									? [data.images[0] as string]
									: undefined,
						},
						unit_amount: itemCents,
					},
					quantity: 1,
				})
			}
			if (items.length === 0) {
				return Response.json(
					{ error: 'No valid paid prompts in cart (minimum charge applies).' },
					{ status: 400 },
				)
			}
			amountCents = totalCents
			title = `Cart (${items.length} item${items.length === 1 ? '' : 's'})`
			description = ''
			line_items = items
		} else if (type === 'credits') {
			const credits = bodyCredits === 2000 ? 2000 : 1000
			const price = CREDITS_PRICES[credits] ?? 10
			amountCents = Math.round(price * 100)
			title = `${credits.toLocaleString()} credits for image generation`
			description = 'Use these credits to generate images or videos.'
			metadata = { type: 'credits', credits: String(credits) }
		} else if (type === 'plan') {
			const plan = bodyPlan === 'pro' ? 'pro' : 'starter'
			const billing = bodyBilling === 'monthly' ? 'monthly' : 'yearly'
			const prices = PLAN_PRICES[plan]
			const price = billing === 'yearly' ? prices.yearly : prices.monthly
			amountCents = Math.round(price * 100)
			const planName = plan === 'pro' ? 'Promptly PRO' : 'Promptly Starter'
			title = planName
			description =
				billing === 'yearly' ? 'With annual billing' : 'With monthly billing'
			metadata = { type: 'plan', plan, billing }
		} else {
			// prompt (default)
			if (!promptId) {
				return Response.json(
					{ error: 'Missing promptId or checkout type (type=credits|plan)' },
					{ status: 400 },
				)
			}
			metadata = { promptId, type: 'prompt' }

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
				if (bodyTitle == null || bodyTitle === '' || bodyPrice == null) {
					return Response.json(
						{
							error:
								'Firebase Admin not available. Send prompt details (title, price) or use type=credits|plan.',
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
		}

		const minLabel = STRIPE_CURRENCY === 'eur' ? '€0.50' : '$0.50'
		if (amountCents < MIN_AMOUNT_CENTS) {
			return Response.json(
				{ error: `Invalid price (minimum ${minLabel})` },
				{ status: 400 },
			)
		}

		const origin = getOrigin(req)
		const baseReturn = `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
		const extraParams: string[] = []
		if (metadata.promptId)
			extraParams.push(`promptId=${encodeURIComponent(metadata.promptId)}`)
		if (metadata.type)
			extraParams.push(`type=${encodeURIComponent(metadata.type)}`)
		if (metadata.credits) extraParams.push(`credits=${metadata.credits}`)
		if (metadata.plan) {
			extraParams.push(`plan=${metadata.plan}`, `billing=${metadata.billing}`)
		}
		const returnUrl = extraParams.length
			? `${baseReturn}&${extraParams.join('&')}`
			: baseReturn

		const stripe = await getStripe()
		const session = await stripe.checkout.sessions.create({
			ui_mode: 'embedded',
			mode: 'payment',
			payment_method_types: ['link', 'card'],
			line_items:
				line_items.length > 0
					? line_items
					: [
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
			return_url: returnUrl,
			metadata,
		})

		return Response.json({
			clientSecret: session.client_secret,
			currency: STRIPE_CURRENCY,
			amountCents,
		})
	} catch (err) {
		console.error('Checkout session error:', err)
		return Response.json(
			{ error: err instanceof Error ? err.message : 'Checkout failed' },
			{ status: 500 },
		)
	}
}
