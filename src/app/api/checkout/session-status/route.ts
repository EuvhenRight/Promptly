import { NextRequest } from 'next/server'
import Stripe from 'stripe'

function getStripe(): Stripe {
	const key = process.env.STRIPE_SECRET_KEY
	if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
	return new Stripe(key)
}

export async function GET(req: NextRequest) {
	const sessionId = req.nextUrl.searchParams.get('session_id')
	if (!sessionId) {
		return Response.json({ error: 'Missing session_id' }, { status: 400 })
	}
	try {
		const stripe = getStripe()
		const session = await stripe.checkout.sessions.retrieve(sessionId)
		return Response.json({
			status: session.status,
			customer_email: session.customer_details?.email ?? null,
		})
	} catch (err) {
		console.error('Session status error:', err)
		return Response.json(
			{ error: err instanceof Error ? err.message : 'Failed to get session' },
			{ status: 500 },
		)
	}
}
