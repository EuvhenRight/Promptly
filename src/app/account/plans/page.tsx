'use client'

import AccountSidebar from '@/components/account/account-sidebar'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import type { UserProfile } from '@/lib/types'
import { doc } from 'firebase/firestore'
import { Check, Crown, Loader2, Sparkles, Star, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { add, format } from 'date-fns'
import { manageSubscriptionCancellation } from '@/firebase/users'
import { useToast } from '@/hooks/use-toast'

const FREE_FEATURES = [
	'For personal use only',
	'Limited generation access',
	'Lower processing priority',
	'All creations are public',
]

const STARTER_FEATURES = [
	'✨ 3,600 total generation credits',
	'Private generations',
	'Access to all models',
	'Unlimited concurrent processing',
]

const PRO_FEATURES = [
	'✨ 7,200 total generation credits',
	'All STARTER Features',
	'Private prompts',
	'50% discount on all our courses',
]

const FAQ_ITEMS = [
	{
		q: 'Can I change plans anytime?',
		a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
	},
	{
		q: 'Do unused credits expire?',
		a: 'Monthly credits reset each billing cycle, but extra credits purchased separately never expire.',
	},
	{
		q: 'What payment methods do you accept?',
		a: 'We accept all major credit cards, PayPal, and other popular payment methods.',
	},
	{
		q: 'Is there a free trial?',
		a: "Yes! Start with our Free plan to try PromptHero before upgrading to a paid plan.",
	},
]

function SubscriptionStatusCard({ profile }: { profile: UserProfile }) {
	const firestore = useFirestore()
	const { toast } = useToast()
	const [isCancelling, setIsCancelling] = useState(false)
	const { planId, planPurchasedAt, planBillingPeriod, planWillCancelAtPeriodEnd } = profile

	if (!planId || planId === 'free') {
		return null
	}

	const handleCancellation = async (cancel: boolean) => {
		setIsCancelling(true)
		try {
			await manageSubscriptionCancellation(firestore, profile.uid, cancel)
			toast({
				title: `Subscription ${cancel ? 'Cancellation Scheduled' : 'Reactivated'}`,
				description: cancel
					? 'Your plan will expire at the end of the current billing period.'
					: 'Your plan will now renew automatically.',
			})
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description: error.message,
			})
		} finally {
			setIsCancelling(false)
		}
	}

	const planName = planId === 'pro' ? 'PRO' : 'Starter'
	const purchaseDate = planPurchasedAt?.toDate()
	const renewalDate =
		purchaseDate &&
		(planBillingPeriod === 'yearly'
			? add(purchaseDate, { years: 1 })
			: add(purchaseDate, { months: 1 }))

	return (
		<Card className='mb-8'>
			<CardHeader>
				<CardTitle>Current Subscription</CardTitle>
				<CardDescription>
					Manage your active plan and billing details.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p>
					You are currently on the{' '}
					<span className='font-bold text-primary'>{planName}</span> plan.
				</p>
				{renewalDate && (
					<p className='text-muted-foreground text-sm mt-1'>
						{planWillCancelAtPeriodEnd
							? `Your plan will expire on ${format(renewalDate, 'PPP')}.`
							: `Your plan renews automatically on ${format(renewalDate, 'PPP')}.`}
					</p>
				)}
			</CardContent>
			<CardFooter>
				{planWillCancelAtPeriodEnd ? (
					<Button
						variant='outline'
						onClick={() => handleCancellation(false)}
						disabled={isCancelling}
					>
						{isCancelling && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						Reactivate Subscription
					</Button>
				) : (
					<Button
						variant='destructive'
						onClick={() => handleCancellation(true)}
						disabled={isCancelling}
					>
						{isCancelling && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						Cancel Subscription
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}

export default function PlansPage() {
	const { user, isUserLoading } = useUser()
	const firestore = useFirestore()
	const router = useRouter()
	const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly')

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile, isLoading: isProfileLoading } =
		useDoc<UserProfile>(userProfileRef)
	const currentPlan = userProfile?.planId ?? 'free'

	const credits = userProfile?.credits ?? 0

	useEffect(() => {
		if (!isUserLoading && !user) {
			router.replace('/')
		}
	}, [user, isUserLoading, router])

	if (isUserLoading || isProfileLoading) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8'>
					<Skeleton className='h-96 w-full animate-pulse rounded-lg bg-muted' />
				</main>
				<Footer />
			</div>
		)
	}

	if (!user || !userProfile) {
		return null
	}

	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8'>
				<div className='flex flex-col lg:flex-row gap-8'>
					<AccountSidebar credits={credits} />

					<div className='flex-1 min-w-0'>
						<SubscriptionStatusCard profile={userProfile} />

						<h1 className='font-headline text-3xl font-bold'>
							Choose Your Plan
						</h1>
						<p className='mt-2 text-muted-foreground'>
							Unlock the full potential of Promptly with our flexible pricing
							options. Start free and upgrade when you're ready.
						</p>

						{/* Billing Toggle */}
						<div className='mt-6 flex items-center gap-3'>
							<Button
								variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
								size='sm'
								onClick={() => setBillingPeriod('monthly')}
							>
								Monthly
							</Button>
							<Button
								variant={billingPeriod === 'yearly' ? 'default' : 'outline'}
								size='sm'
								onClick={() => setBillingPeriod('yearly')}
							>
								Yearly
							</Button>
							<span className='text-sm text-green-600 font-medium'>
								Save up to 15% with yearly billing!
							</span>
						</div>

						{/* Plan Cards */}
						<div className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
							{/* Free */}
							<Card className={cn(currentPlan === 'free' && 'border-primary ring-2 ring-primary')}>
								<CardHeader>
									<Star className='h-8 w-8 text-muted-foreground' />
									<CardTitle>Free</CardTitle>
									<CardDescription>
										Get started with basic features
									</CardDescription>
									<p className='text-2xl font-bold'>€0</p>
									<p className='text-sm text-muted-foreground'>forever</p>
								</CardHeader>
								<CardContent className='space-y-3'>
									{FREE_FEATURES.map(f => (
										<div key={f} className='flex items-start gap-2'>
											<Check className='h-4 w-4 text-green-600 shrink-0 mt-0.5' />
											<span className='text-sm'>{f}</span>
										</div>
									))}
								</CardContent>
								<CardFooter>
									<Button variant='outline' className='w-full' disabled={currentPlan === 'free'}>
										{currentPlan === 'free' ? 'Current Plan' : 'Switch to Free'}
									</Button>
								</CardFooter>
							</Card>

							{/* Starter */}
							<Card className={cn(currentPlan === 'starter' && 'border-primary ring-2 ring-primary')}>
								<CardHeader>
									<Sparkles className='h-8 w-8 text-amber-500' />
									<CardTitle>Starter</CardTitle>
									<CardDescription>
										For enthusiasts creating occasionally
									</CardDescription>
									<p className='text-2xl font-bold'>
										€{billingPeriod === 'yearly' ? '9' : '10'}
									</p>
									<p className='text-sm text-muted-foreground'>
										per month
										{billingPeriod === 'yearly' && (
											<span className='text-green-600'> (billed yearly)</span>
										)}
									</p>
								</CardHeader>
								<CardContent className='space-y-3'>
									{STARTER_FEATURES.map(f => (
										<div key={f} className='flex items-start gap-2'>
											<Check className='h-4 w-4 text-green-600 shrink-0 mt-0.5' />
											<span className='text-sm'>{f}</span>
										</div>
									))}
								</CardContent>
								<CardFooter>
									<Button className='w-full' asChild disabled={currentPlan === 'starter'}>
										<Link
											href={currentPlan !== 'starter' ? `/checkout?type=plan&plan=starter&billing=${billingPeriod}` : '#'}
										>
											{currentPlan === 'starter' ? 'Current Plan' : 'Upgrade to Starter'}
										</Link>
									</Button>
								</CardFooter>
							</Card>

							{/* Pro */}
							<Card className={cn('relative', currentPlan === 'pro' && 'border-primary ring-2 ring-primary')}>
								<div className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1'>
									<Crown className='h-3 w-3' />
									<span>PRO</span>
								</div>
								<CardHeader>
									<Crown className='h-8 w-8 text-primary' />
									<CardTitle>Pro</CardTitle>
									<CardDescription>
										For experts creating daily
									</CardDescription>
									<p className='text-2xl font-bold'>
										€{billingPeriod === 'yearly' ? '19' : '22'}
									</p>
									<p className='text-sm text-muted-foreground'>
										per month
										{billingPeriod === 'yearly' && (
											<span className='text-green-600'> (billed yearly)</span>
										)}
									</p>
								</CardHeader>
								<CardContent className='space-y-3'>
									{PRO_FEATURES.map(f => (
										<div key={f} className='flex items-start gap-2'>
											<Check className='h-4 w-4 text-green-600 shrink-0 mt-0.5' />
											<span className='text-sm'>{f}</span>
										</div>
									))}
								</CardContent>
								<CardFooter>
									<Button className='w-full' asChild disabled={currentPlan === 'pro'}>
										<Link
											href={currentPlan !== 'pro' ? `/checkout?type=plan&plan=pro&billing=${billingPeriod}` : '#'}
										>
											{currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
										</Link>
									</Button>
								</CardFooter>
							</Card>
						</div>

						{/* Need Extra Credits */}
						<section id='credits' className='mt-16'>
							<h2 className='font-headline text-3xl font-bold text-center'>
								Need Extra Credits?
							</h2>
							<p className='mt-2 text-muted-foreground text-center max-w-xl mx-auto'>
								Purchase credits that never expire and roll over month to month.
							</p>
							<div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto'>
								{/* 300 Credits Card */}
								<Card className='flex flex-col text-center p-8'>
									<div className='flex-grow space-y-4'>
										<div className='flex justify-center'>
											<div className='bg-muted text-foreground p-4 rounded-lg inline-block'>
												<Zap className='h-8 w-8' />
											</div>
										</div>
										<h3 className='text-2xl font-bold'>300 Credits</h3>
										<p className='text-muted-foreground'>
											Great for getting started and occasional use.
										</p>
										<p className='text-4xl font-bold'>€10</p>
									</div>
									<Button className='w-full mt-6' size='lg' asChild>
										<Link href='/checkout?type=credits&credits=300'>
											Buy Credits
										</Link>
									</Button>
								</Card>

								{/* 500 Credits Card */}
								<Card className='relative flex flex-col text-center p-8 border-primary ring-2 ring-primary'>
									<div className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium'>
										Best Value
									</div>
									<div className='flex-grow space-y-4'>
										<div className='flex justify-center'>
											<div className='bg-primary/10 text-primary p-4 rounded-lg inline-block'>
												<Zap className='h-8 w-8' />
											</div>
										</div>
										<h3 className='text-2xl font-bold'>500 Credits</h3>
										<p className='text-muted-foreground'>
											Perfect for power users and frequent creation.
										</p>
										<p className='text-4xl font-bold'>€18</p>
									</div>
									<Button className='w-full mt-6' size='lg' asChild>
										<Link href='/checkout?type=credits&credits=500'>
											Buy Credits
										</Link>
									</Button>
								</Card>
							</div>
						</section>

						{/* FAQ */}
						<section className='mt-16'>
							<h2 className='font-headline text-2xl font-bold mb-6'>
								Frequently Asked Questions
							</h2>
							<Accordion type='single' collapsible className='w-full'>
								{FAQ_ITEMS.map((item, i) => (
									<AccordionItem key={i} value={`faq-${i}`}>
										<AccordionTrigger>{item.q}</AccordionTrigger>
										<AccordionContent>{item.a}</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</section>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
