'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { StripeCheckout } from '@/components/stripe-checkout'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/firebase'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type CheckoutType = 'credits' | 'plan'

function CheckoutContent() {
	const searchParams = useSearchParams()
	const typeParam = searchParams.get('type') as CheckoutType | null
	const creditsParam = searchParams.get('credits')
	const planParam = searchParams.get('plan')
	const billingParam = searchParams.get('billing')

	const { user } = useUser()

	const [clientSecret, setClientSecret] = useState<string | null>(null)
	const [checkoutError, setCheckoutError] = useState<string | null>(null)
	const [currency, setCurrency] = useState<string>('eur')
	const [amountCents, setAmountCents] = useState<number | null>(null)
	const [checkoutTitle, setCheckoutTitle] = useState<string>('')
	const [checkoutDescription, setCheckoutDescription] = useState<string | undefined>()
	const [priceLabel, setPriceLabel] = useState<string | undefined>()
	const [backHref, setBackHref] = useState<string>('/')
	const [productPrice, setProductPrice] = useState<number | undefined>()

	const type = typeParam
	const credits = creditsParam === '2000' ? 2000 : creditsParam === '1000' ? 1000 : null
	const plan = planParam === 'pro' ? 'pro' : planParam === 'starter' ? 'starter' : null
	const billing = billingParam === 'monthly' ? 'monthly' : 'yearly'

	useEffect(() => {
		if (type === 'credits') {
			const amount = credits ?? 1000
			setCheckoutTitle(`${amount.toLocaleString()} credits`)
			setCheckoutDescription('For generating images, videos, and more.')
			setBackHref('/account/plans')
			setPriceLabel(undefined)
		} else if (type === 'plan') {
			const planName = plan === 'pro' ? 'Promptly PRO' : 'Promptly Starter'
			setCheckoutTitle(planName)
			setCheckoutDescription(
				billing === 'yearly' ? 'With annual billing' : 'With monthly billing',
			)
			setPriceLabel(billing === 'yearly' ? 'per year' : 'per month')
			setBackHref('/account/plans')
		}
	}, [type, credits, plan, billing])

	useEffect(() => {
		if (type !== 'credits' && type !== 'plan') return
		if (!user) return // Wait for user to be loaded

		setCheckoutError(null)
		const payload: Record<string, unknown> = { type }
		if (type === 'credits') {
			payload.credits = credits ?? 1000
		}
		if (type === 'plan') {
			payload.plan = plan ?? 'pro'
			payload.billing = billing
		}
		payload.userId = user.uid

		fetch('/api/checkout', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		})
			.then(async res => {
				const data = await res.json()
				if (!res.ok) throw new Error(data.error || 'Checkout failed')
				return data
			})
			.then(data => {
				setClientSecret(data.clientSecret)
				if (data.currency) setCurrency(data.currency)
				if (typeof data.amountCents === 'number') {
					setAmountCents(data.amountCents)
					setProductPrice(data.amountCents / 100)
				}
			})
			.catch(err => {
				setCheckoutError(err.message || 'Failed to load checkout')
			})
	}, [type, credits, plan, billing, user])

	if (!type || !user) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8 text-center'>
					<h2 className='text-xl font-semibold'>Invalid Checkout Session</h2>
					<p className='text-muted-foreground mt-2'>
						{!user
							? 'Please sign in to purchase credits or plans.'
							: 'Please select a credit pack or a subscription plan to purchase.'}
					</p>
					<Button asChild className='mt-6'>
						<Link href='/account/plans'>View Plans & Credits</Link>
					</Button>
				</main>
				<Footer />
			</div>
		)
	}

	const isLoadingSecret = !clientSecret && !checkoutError
	const displayPrice = productPrice ?? (amountCents != null ? amountCents / 100 : undefined)

	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow w-full px-0 py-0'>
				<StripeCheckout
					productName={checkoutTitle || 'Checkout'}
					backHref={backHref}
					clientSecret={clientSecret}
					checkoutError={checkoutError}
					isLoadingSecret={isLoadingSecret}
					productPrice={displayPrice}
					currency={currency}
					description={checkoutDescription}
					priceLabel={priceLabel}
				/>
			</main>
			<Footer />
		</div>
	)
}

export default function CheckoutPage() {
	return (
		<Suspense
			fallback={
				<div className='flex min-h-screen flex-col'>
					<Header />
					<main className='flex-grow container mx-auto px-4 py-8'>
						<Skeleton className='h-[80vh] w-full rounded-lg' />
					</main>
					<Footer />
				</div>
			}
		>
			<CheckoutContent />
		</Suspense>
	)
}
