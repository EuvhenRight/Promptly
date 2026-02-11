'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { StripeCheckout } from '@/components/stripe-checkout'
import { Skeleton } from '@/components/ui/skeleton'
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase'
import type { Prompt } from '@/lib/types'
import { doc } from 'firebase/firestore'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

type CheckoutType = 'prompt' | 'credits' | 'plan'

function CheckoutContent() {
	const searchParams = useSearchParams()
	const promptId = searchParams.get('promptId')
	const typeParam = searchParams.get('type') as CheckoutType | null
	const creditsParam = searchParams.get('credits')
	const planParam = searchParams.get('plan')
	const billingParam = searchParams.get('billing')

	const firestore = useFirestore()
	const promptRef = useMemoFirebase(
		() => (firestore && promptId ? doc(firestore, 'prompts', promptId) : null),
		[firestore, promptId],
	)
	const { data: prompt, isLoading: isPromptLoading } = useDoc<Prompt>(promptRef)

	const [error, setError] = useState<string | null>(null)
	const [clientSecret, setClientSecret] = useState<string | null>(null)
	const [checkoutError, setCheckoutError] = useState<string | null>(null)
	const [currency, setCurrency] = useState<string>('usd')
	const [amountCents, setAmountCents] = useState<number | null>(null)
	const [checkoutTitle, setCheckoutTitle] = useState<string>('')
	const [checkoutDescription, setCheckoutDescription] = useState<string | undefined>()
	const [priceLabel, setPriceLabel] = useState<string | undefined>()
	const [backHref, setBackHref] = useState<string>('/')
	const [productPrice, setProductPrice] = useState<number | undefined>()
	const [imageUrl, setImageUrl] = useState<string | undefined>()

	const type: CheckoutType | null = typeParam ?? (promptId ? 'prompt' : null)
	const credits = creditsParam === '2000' ? 2000 : creditsParam === '1000' ? 1000 : null
	const plan = planParam === 'pro' ? 'pro' : planParam === 'starter' ? 'starter' : null
	const billing = billingParam === 'monthly' ? 'monthly' : 'yearly'

	// Set display strings for credits/plan immediately
	useEffect(() => {
		if (type === 'credits') {
			const amount = credits ?? 1000
			setCheckoutTitle(`${amount.toLocaleString()} credits for image generation`)
			setCheckoutDescription('Use these credits to generate images or videos.')
			setBackHref('/account/plans')
			setPriceLabel(undefined)
			setImageUrl(undefined)
		} else if (type === 'plan') {
			const planName = plan === 'pro' ? 'Promptly PRO' : 'Promptly Starter'
			setCheckoutTitle(planName)
			setCheckoutDescription(
				billing === 'yearly' ? 'With annual billing' : 'With monthly billing',
			)
			setPriceLabel(billing === 'yearly' ? 'per year' : 'per month')
			setBackHref('/account/plans')
			setImageUrl(undefined)
		}
	}, [type, credits, plan, billing])

	// Fetch checkout session for credits or plan (no prompt needed)
	useEffect(() => {
		if (type !== 'credits' && type !== 'plan') return
		setCheckoutError(null)
		const payload: Record<string, unknown> = { type }
		if (type === 'credits') payload.credits = credits ?? 1000
		if (type === 'plan') {
			payload.plan = plan ?? 'pro'
			payload.billing = billing
		}
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
	}, [type, credits, plan, billing])

	// Fetch checkout session for prompt (after prompt loaded)
	useEffect(() => {
		if (type !== 'prompt' || !promptId || isPromptLoading) return
		setCheckoutError(null)
		const payload: {
			type: 'prompt'
			promptId: string
			title?: string
			price?: number
			description?: string
			image?: string
		} = { type: 'prompt', promptId }
		if (prompt) {
			payload.title = prompt.title
			payload.price = prompt.price
			payload.description = prompt.description
			if (prompt.images?.[0]) payload.image = prompt.images[0]
		}
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
				if (typeof data.amountCents === 'number') setAmountCents(data.amountCents)
			})
			.catch(err => {
				setCheckoutError(err.message || 'Failed to load checkout')
			})
	}, [type, promptId, isPromptLoading, prompt])

	// Set display strings for prompt when loaded
	useEffect(() => {
		if (type === 'prompt' && prompt) {
			setCheckoutTitle(`Buy Prompt: ${prompt.title}`)
			setCheckoutDescription(prompt.description)
			setProductPrice(prompt.price)
			setBackHref(`/prompt/${promptId}`)
			setPriceLabel(undefined)
			setImageUrl(prompt.images?.[0])
		}
	}, [type, prompt, promptId])

	useEffect(() => {
		if (!promptId && type !== 'credits' && type !== 'plan') {
			setError('Missing product. Choose a plan, credits, or buy a prompt.')
		}
	}, [promptId, type])

	// No valid checkout context
	if (!type) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8'>
					<p className='text-destructive'>{error || 'Missing product.'}</p>
					<div className='mt-4 flex gap-4'>
						<a href='/' className='text-primary underline'>
							Back to home
						</a>
						<a href='/account/plans' className='text-primary underline'>
							Plans & credits
						</a>
					</div>
				</main>
				<Footer />
			</div>
		)
	}

	// Prompt: wait for prompt to load before showing checkout UI
	if (type === 'prompt' && isPromptLoading) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow w-full px-0 py-0'>
					<Skeleton className='h-[80vh] w-full' />
				</main>
				<Footer />
			</div>
		)
	}

	// Prompt but no promptId (shouldn't happen if type=prompt)
	if (type === 'prompt' && !promptId) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8'>
					<p className='text-destructive'>Missing prompt.</p>
					<a href='/' className='text-primary underline mt-2 inline-block'>
						Back to home
					</a>
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
					productName={checkoutTitle || (type === 'prompt' && prompt ? `Buy Prompt: ${prompt.title}` : 'Checkout')}
					backHref={backHref}
					clientSecret={clientSecret}
					checkoutError={checkoutError}
					isLoadingSecret={isLoadingSecret}
					productPrice={displayPrice}
					currency={currency}
					description={checkoutDescription ?? (type === 'prompt' ? prompt?.description : undefined)}
					imageUrl={imageUrl ?? (type === 'prompt' ? prompt?.images?.[0] : undefined)}
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
