'use client'

import {
	EmbeddedCheckout,
	EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

function formatPrice(amount: number, currency: string): string {
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: currency.toUpperCase(),
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount)
}

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
	/** Product price in main unit (e.g. 100 for 100 EUR) for order summary */
	productPrice?: number
	/** Currency code (e.g. 'eur', 'usd') for formatting */
	currency?: string
	/** Short product description for left column */
	description?: string
	/** Product image URL */
	imageUrl?: string
	/** Label under price (e.g. "per year", "per month") */
	priceLabel?: string
}

export function StripeCheckout({
	productName,
	backHref,
	clientSecret,
	checkoutError,
	isLoadingSecret,
	productPrice,
	currency = 'usd',
	description,
	imageUrl,
	priceLabel,
}: StripeCheckoutProps) {
	const displayPrice =
		productPrice != null && Number.isFinite(productPrice)
			? formatPrice(productPrice, currency)
			: null

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
				<div className='flex flex-col items-center justify-center gap-4 min-h-[360px] text-neutral-500'>
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
			<div className='space-y-4'>
				<EmbeddedCheckoutProvider
					stripe={stripePromise}
					options={{ clientSecret }}
				>
					<EmbeddedCheckout className='min-h-[360px]' />
				</EmbeddedCheckoutProvider>
				<p className='text-xs text-neutral-500 mt-4'>
					If your card is declined or you see an error, check your card details
					and try again. Test: use card 4242 4242 4242 4242 (no real charges).
				</p>
			</div>
		)
	}

	return (
		<div className='w-full min-h-[80vh]'>
			<div className='grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]'>
				{/* Left: half screen, black, Prompthero-style spacing & typography */}
				<div className='flex flex-col bg-black text-white p-8 lg:p-10 xl:p-12 border-r border-zinc-800'>
					<Link
						href={backHref}
						className='inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8'
					>
						<ArrowLeft className='h-4 w-4 shrink-0' />
						Go back
					</Link>
					<h1 className='font-headline text-lg font-bold text-white mb-1'>
						Promptly
					</h1>
					<p className='text-zinc-400 text-[15px] mb-8'>Purchase</p>

					{/* Subscription/title line like reference */}
					<p className='text-zinc-300 text-[15px] mb-4'>
						{productName}
					</p>
					{/* Large price */}
					{displayPrice != null && (
						<p className='text-3xl xl:text-4xl font-bold text-white leading-tight mb-1'>
							{displayPrice}
						</p>
					)}
					<p className='text-zinc-400 text-sm mb-8'>
						{priceLabel ?? 'One-time purchase'}
					</p>

					{/* Product line with image */}
					<div className='flex gap-3 mb-6'>
						{imageUrl && (
							<div className='relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-zinc-800'>
								<Image
									src={imageUrl}
									alt=''
									fill
									className='object-cover'
									sizes='48px'
								/>
							</div>
						)}
						<div className='min-w-0 flex-1 flex flex-col justify-center'>
							<p className='font-medium text-white text-[15px] truncate'>
								{productName}
							</p>
							{description && (
								<p className='text-xs text-zinc-400 line-clamp-2 mt-0.5'>
									{description}
								</p>
							)}
						</div>
						{displayPrice != null && (
							<span className='text-[15px] font-medium text-white shrink-0'>
								{displayPrice}
							</span>
						)}
					</div>

					{/* Order breakdown */}
					<div className='space-y-3 pt-5 border-t border-zinc-800'>
						<div className='flex justify-between text-[15px]'>
							<span className='text-zinc-400'>Subtotal</span>
							{displayPrice != null && (
								<span className='text-zinc-300'>{displayPrice}</span>
							)}
						</div>
						<button
							type='button'
							className='w-full text-left text-[15px] text-zinc-400 py-3 px-4 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 mt-2 disabled:opacity-50'
							disabled
						>
							Enter promo code
						</button>
					</div>

					<div className='mt-8 pt-6 border-t border-zinc-800'>
						<p className='text-[15px] text-zinc-400 mb-1'>
							Total due today
						</p>
						{displayPrice != null ? (
							<p className='text-2xl font-bold text-white'>{displayPrice}</p>
						) : (
							<p className='text-xl font-semibold text-white'>—</p>
						)}
					</div>
				</div>

				{/* Right: half screen, light like reference (white), same padding/margins */}
				<div className='flex flex-col bg-white min-h-[400px] p-8 lg:p-10 xl:p-12'>
					{rightContent()}
				</div>
			</div>
		</div>
	)
}
