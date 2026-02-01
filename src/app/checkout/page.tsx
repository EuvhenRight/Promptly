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

function CheckoutContent() {
	const searchParams = useSearchParams()
	const promptId = searchParams.get('promptId')
	const firestore = useFirestore()

	const promptRef = useMemoFirebase(
		() => (firestore && promptId ? doc(firestore, 'prompts', promptId) : null),
		[firestore, promptId],
	)
	const { data: prompt, isLoading } = useDoc<Prompt>(promptRef)

	const [error, setError] = useState<string | null>(null)
	const [clientSecret, setClientSecret] = useState<string | null>(null)
	const [checkoutError, setCheckoutError] = useState<string | null>(null)

	// Pre-fetch client secret so we can show API errors and ensure Stripe has a secret to mount
	useEffect(() => {
		if (!promptId || isLoading) return
		setCheckoutError(null)
		const payload: {
			promptId: string
			title?: string
			price?: number
			description?: string
			image?: string
		} = {
			promptId,
		}
		// When Firebase Admin is not available, API uses client-sent prompt details
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
				if (!res.ok) {
					throw new Error(data.error || 'Checkout failed')
				}
				return data
			})
			.then(data => {
				setClientSecret(data.clientSecret)
			})
			.catch(err => {
				setCheckoutError(err.message || 'Failed to load checkout')
			})
	}, [promptId, isLoading, prompt])

	useEffect(() => {
		if (!promptId)
			setError('Missing product. Go back and use "Buy Now" from a prompt.')
	}, [promptId])

	if (!promptId) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8'>
					<p className='text-destructive'>{error || 'Missing product.'}</p>
					<a href='/' className='text-primary underline mt-2 inline-block'>
						Back to home
					</a>
				</main>
				<Footer />
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8'>
					<Skeleton className='h-[80vh] w-full rounded-lg' />
				</main>
				<Footer />
			</div>
		)
	}

	const productName = prompt?.title ? `Prompt: ${prompt.title}` : 'Prompt'
	const backHref = `/prompt/${promptId}`

	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow container mx-auto px-4 py-8'>
				<StripeCheckout
					productName={productName}
					backHref={backHref}
					clientSecret={clientSecret}
					checkoutError={checkoutError}
					isLoadingSecret={!clientSecret && !checkoutError}
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
