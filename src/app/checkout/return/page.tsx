'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

type Status = 'loading' | 'complete' | 'open' | 'error'

function CheckoutReturnContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const sessionId = searchParams.get('session_id')
	const fulfillCalled = useRef(false)

	const [status, setStatus] = useState<Status>('loading')
	const [customerEmail, setCustomerEmail] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [grantedPromptIds, setGrantedPromptIds] = useState<string[]>([])
	const [grantedCredits, setGrantedCredits] = useState<number>(0)

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

	// When payment is complete, fulfill: grant prompts to user so they stay opened
	useEffect(() => {
		if (status !== 'complete' || !sessionId || fulfillCalled.current) return
		fulfillCalled.current = true
		fetch('/api/checkout/fulfill', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ session_id: sessionId }),
		})
			.then(res => res.json())
			.then(data => {
				if (data.granted && Array.isArray(data.granted)) {
					setGrantedPromptIds(data.granted)
				}
				if (typeof data.grantedCredits === 'number' && data.grantedCredits > 0) {
					setGrantedCredits(data.grantedCredits)
				}
			})
			.catch(() => {
				// Non-blocking: user still paid; prompts may be granted by webhook or support
			})
	}, [status, sessionId])

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
					<div className='flex flex-col items-center gap-4 py-12 text-muted-foreground'>
						<Skeleton className='h-16 w-16 rounded-full' />
						<p>Verifying your payment…</p>
					</div>
				)}
				{status === 'error' && (
					<div className='rounded-xl border border-destructive/50 bg-destructive/5 p-8 text-center'>
						<AlertCircle className='mx-auto h-14 w-14 text-destructive mb-4' />
						<h1 className='font-headline text-xl font-bold text-foreground mb-2'>
							Something went wrong
						</h1>
						<p className='text-destructive mb-1'>
							{error || 'We couldn’t confirm your payment.'}
						</p>
						<p className='text-sm text-muted-foreground mb-6'>
							If you were charged, we’ll still process your order. Otherwise,
							try paying again from the checkout page.
						</p>
						<div className='flex flex-col sm:flex-row gap-3 justify-center'>
							<Button asChild variant='outline'>
								<Link href='/'>Back to home</Link>
							</Button>
							<Button asChild>
								<Link
									href={
										searchParams.get('promptId')
											? `/checkout?promptId=${searchParams.get('promptId')}`
											: '/'
									}
								>
									Try checkout again
								</Link>
							</Button>
						</div>
					</div>
				)}
				{status === 'complete' && (
					<div className='rounded-xl border bg-card shadow-sm p-8 text-center'>
						<CheckCircle2 className='mx-auto h-16 w-16 text-green-600 dark:text-green-500 mb-6' />
						<h1 className='font-headline text-2xl font-bold text-foreground mb-2'>
							Thank you for your payment
						</h1>
						<p className='text-muted-foreground mb-6'>
							Your purchase was successful.
							{grantedCredits > 0 && (
								<> {grantedCredits.toLocaleString()} credits have been added to your wallet.</>
							)}
							{grantedPromptIds.length > 0 && (
								<>
									{' '}
									The prompt{grantedPromptIds.length !== 1 ? 's are' : ' is'} now
									unlocked for you.
								</>
							)}
							{grantedCredits === 0 && grantedPromptIds.length === 0 && (
								<> A confirmation email will be sent to you.</>
							)}
							{' '}
							{customerEmail && (grantedCredits > 0 || grantedPromptIds.length > 0) && (
								<>
									{' '}
									Confirmation will be sent to{' '}
									<span className='text-foreground font-medium'>{customerEmail}</span>.
								</>
							)}
						</p>
						<div className='flex flex-col sm:flex-row gap-3 justify-center'>
							<Button asChild size='lg'>
								<Link href='/'>Back to home</Link>
							</Button>
							{grantedCredits > 0 && (
								<Button asChild size='lg' variant='outline'>
									<Link href='/account/wallet'>View my wallet</Link>
								</Button>
							)}
							{grantedPromptIds.length > 0 && (
								<Button asChild size='lg' variant='outline'>
									<Link
										href={
											grantedPromptIds.length === 1
												? `/prompt/${grantedPromptIds[0]}`
												: '/account/profile'
										}
									>
										{grantedPromptIds.length === 1
											? 'View your prompt'
											: 'View my prompts'}
									</Link>
								</Button>
							)}
						</div>
					</div>
				)}
			</main>
			<Footer />
		</div>
	)
}

export default function CheckoutReturnPage() {
	return (
		<Suspense
			fallback={
				<div className='flex min-h-screen flex-col'>
					<Header />
					<main className='flex-grow container mx-auto px-4 py-8 max-w-lg'>
						<Skeleton className='h-24 w-full rounded-lg' />
					</main>
					<Footer />
				</div>
			}
		>
			<CheckoutReturnContent />
		</Suspense>
	)
}
