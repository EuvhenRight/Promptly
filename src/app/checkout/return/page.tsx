'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Status = 'loading' | 'complete' | 'open' | 'error'

export default function CheckoutReturnPage() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const sessionId = searchParams.get('session_id')

	const [status, setStatus] = useState<Status>('loading')
	const [customerEmail, setCustomerEmail] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!sessionId) {
			setStatus('error')
			setError('Missing session')
			return
		}
		fetch(
			`/api/checkout/session-status?session_id=${encodeURIComponent(sessionId)}`,
		)
			.then(res => res.json())
			.then(data => {
				setStatus(data.status ?? 'error')
				setCustomerEmail(data.customer_email ?? null)
				if (data.error) setError(data.error)
			})
			.catch(err => {
				setStatus('error')
				setError(err.message || 'Failed to load session')
			})
	}, [sessionId])

	useEffect(() => {
		if (status === 'open') {
			const promptId = searchParams.get('promptId')
			router.replace(promptId ? `/checkout?promptId=${promptId}` : '/checkout')
		}
	}, [status, router, searchParams])

	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow container mx-auto px-4 py-8 max-w-lg'>
				{status === 'loading' && (
					<p className='text-muted-foreground'>Loading…</p>
				)}
				{status === 'error' && (
					<div>
						<p className='text-destructive'>
							{error || 'Something went wrong.'}
						</p>
						<Button asChild className='mt-4'>
							<Link href='/'>Back to home</Link>
						</Button>
					</div>
				)}
				{status === 'complete' && (
					<div className='rounded-lg border bg-card p-6 space-y-4'>
						<h1 className='font-headline text-2xl font-bold'>
							Thanks for your order!
						</h1>
						<p className='text-muted-foreground'>
							A confirmation email will be sent to {customerEmail || 'you'}.
						</p>
						<p className='text-xs text-muted-foreground'>
							Test mode: use card 4242 4242 4242 4242 (no real charges).
						</p>
						<Button asChild>
							<Link href='/'>Back to home</Link>
						</Button>
					</div>
				)}
			</main>
			<Footer />
		</div>
	)
}
