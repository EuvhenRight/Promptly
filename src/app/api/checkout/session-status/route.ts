import { NextRequest } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(req: NextRequest) {
	const sessionId = req.nextUrl.searchParams.get('session_id')
	if (!sessionId) {
		return Response.json({ error: 'Missing session_id' }, { status: 400 })
	}
	try {
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
