'use client'

import {
	EmbeddedCheckout,
	EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

export type StripeCheckoutProps = {
	/** Product or service name (e.g. "Prompt: My Awesome Prompt") */
	productName: string
	/** URL for the back button */
	backHref: string
	/** Checkout Session client secret from the API (pre-fetched so we can show errors) */
	clientSecret: string | null
	/** Error message from the checkout API (e.g. Firebase Admin not set up) */
	checkoutError?: string | null
	/** True while the client secret is being fetched */
	isLoadingSecret?: boolean
}

export function StripeCheckout({
	productName,
	backHref,
	clientSecret,
	checkoutError,
	isLoadingSecret,
}: StripeCheckoutProps) {
	const rightContent = () => {
		if (checkoutError) {
			return (
				<div className='rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive'>
					<p className='font-medium'>Checkout unavailable</p>
					<p className='mt-2 text-sm'>{checkoutError}</p>
					{checkoutError.includes('Firebase Admin') && (
						<p className='mt-3 text-sm text-muted-foreground'>
							Add{' '}
							<code className='rounded bg-muted px-1'>
								service-account.json
							</code>{' '}
							to the project root for server-side prompt lookup.
						</p>
					)}
				</div>
			)
		}
		if (isLoadingSecret || !clientSecret) {
			return (
				<div className='flex flex-col items-center justify-center gap-4 min-h-[400px] text-muted-foreground'>
					<Loader2 className='h-10 w-10 animate-spin' />
					<p>Loading payment form…</p>
				</div>
			)
		}
		if (!stripePromise) {
			return (
				<div className='rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive'>
					<p className='font-medium'>Stripe not configured</p>
					<p className='mt-2 text-sm'>
						Set{' '}
						<code className='rounded bg-muted px-1'>
							NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
						</code>{' '}
						in <code className='rounded bg-muted px-1'>.env</code>.
					</p>
				</div>
			)
		}
		return (
			<EmbeddedCheckoutProvider
				stripe={stripePromise}
				options={{ clientSecret }}
			>
				<EmbeddedCheckout className='min-h-[400px]' />
			</EmbeddedCheckoutProvider>
		)
	}

	return (
		<div className='grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]'>
			{/* Left 50%: back, site name, product name */}
			<div className='flex flex-col justify-center p-8 lg:p-12 border-r bg-muted/30'>
				<Link
					href={backHref}
					className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8'
				>
					<ArrowLeft className='h-4 w-4' />
					Go back
				</Link>
				<h1 className='font-headline text-2xl font-bold mb-2'>Promptly</h1>
				<p className='text-muted-foreground'>Purchase</p>
				<p className='font-semibold text-lg mt-1'>{productName}</p>
				<p className='text-xs text-muted-foreground mt-4'>
					Test: use card 4242 4242 4242 4242 (no real charges).
				</p>
			</div>

			{/* Right 50%: Stripe embedded checkout (card form) or loading/error */}
			<div className='flex flex-col p-8 lg:p-12 min-h-[400px]'>
				{rightContent()}
			</div>
		</div>
	)
}
