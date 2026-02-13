'use client'

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
import { useUser } from '@/firebase'
import { signInWithGoogle } from '@/firebase/auth'
import { Check, Crown, Star } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

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
		a: "Yes! Start with our Free plan to try Promptly before upgrading to a paid plan.",
	},
]

export default function PlansPage() {
	const { user, isUserLoading } = useUser()
	const router = useRouter()
	const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly')

	useEffect(() => {
		if (!isUserLoading && user) {
			router.replace('/account/plans')
		}
	}, [user, isUserLoading, router])

	if (isUserLoading || user) {
		return (
			<div className='flex h-screen items-center justify-center'>
				Loading...
			</div>
		)
	}

	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow container mx-auto px-4 py-12 sm:px-6 lg:px-8'>
				<div className='max-w-5xl mx-auto'>
					<h1 className='font-headline text-center text-4xl font-bold sm:text-5xl'>
						Choose Your Plan
					</h1>
					<p className='mt-4 text-center text-lg text-muted-foreground max-w-2xl mx-auto'>
						Unlock the full potential of Promptly with our flexible pricing
						options. Start free and upgrade when you're ready.
					</p>

					{/* Billing Toggle */}
					<div className='mt-8 flex flex-col items-center gap-2'>
						<div className='flex items-center gap-3'>
							<Button
								variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
								onClick={() => setBillingPeriod('monthly')}
							>
								Monthly
							</Button>
							<Button
								variant={billingPeriod === 'yearly' ? 'default' : 'outline'}
								onClick={() => setBillingPeriod('yearly')}
							>
								Yearly
							</Button>
						</div>
						<span className='text-sm text-green-600 font-medium'>
							Save up to 15% with yearly billing!
						</span>
					</div>

					{/* Plan Cards */}
					<div className='mt-10 grid grid-cols-1 md:grid-cols-3 gap-8'>
						{/* Free */}
						<Card className='flex flex-col'>
							<CardHeader className='items-center text-center'>
								<div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
									<Star className='h-7 w-7 text-muted-foreground' />
								</div>
								<CardTitle>Free</CardTitle>
								<CardDescription>
									Get started with limited access.
								</CardDescription>
								<p className='text-4xl font-bold'>€0</p>
							</CardHeader>
							<CardContent className='space-y-3 flex-grow'>
								{FREE_FEATURES.map(f => (
									<div key={f} className='flex items-start gap-2'>
										<Check className='h-4 w-4 text-green-600 shrink-0 mt-1' />
										<span className='text-sm'>{f}</span>
									</div>
								))}
							</CardContent>
							<CardFooter>
								<Button
									variant='outline'
									className='w-full'
									onClick={() => signInWithGoogle()}
								>
									Get Started Free
								</Button>
							</CardFooter>
						</Card>

						{/* Starter */}
						<Card className='flex flex-col'>
							<CardHeader className='items-center text-center'>
								<div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
									<Star className='h-7 w-7 text-amber-500' />
								</div>
								<CardTitle>Starter</CardTitle>
								<CardDescription>
									For enthusiasts creating occasionally.
								</CardDescription>
								<div className='flex items-baseline justify-center gap-2'>
									<p className='text-4xl font-bold'>
										€{billingPeriod === 'yearly' ? '9' : '10'}
									</p>
									<span className='text-sm text-muted-foreground'>/ mo</span>
								</div>
								<p className='text-xs text-muted-foreground'>
									{billingPeriod === 'yearly' && (
										<span className='text-green-600'>
											(Billed yearly at €108)
										</span>
									)}
								</p>
							</CardHeader>
							<CardContent className='space-y-3 flex-grow'>
								{STARTER_FEATURES.map(f => (
									<div key={f} className='flex items-start gap-2'>
										<Check className='h-4 w-4 text-green-600 shrink-0 mt-1' />
										<span className='text-sm'>{f}</span>
									</div>
								))}
							</CardContent>
							<CardFooter>
								<Button className='w-full' asChild>
									<Link
										href={`/checkout?type=plan&plan=starter&billing=${billingPeriod}`}
									>
										Get Started with Starter
									</Link>
								</Button>
							</CardFooter>
						</Card>

						{/* Pro */}
						<Card className='relative flex flex-col border-primary ring-2 ring-primary'>
							<div className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium'>
								Most Popular
							</div>
							<CardHeader className='items-center text-center'>
								<div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
									<Crown className='h-7 w-7 text-amber-500' />
								</div>
								<CardTitle>Pro</CardTitle>
								<CardDescription>For experts creating daily.</CardDescription>
								<div className='flex items-baseline justify-center gap-2'>
									<p className='text-4xl font-bold'>
										€{billingPeriod === 'yearly' ? '19' : '22'}
									</p>
									<span className='text-sm text-muted-foreground'>/ mo</span>
								</div>
								<p className='text-xs text-muted-foreground'>
									{billingPeriod === 'yearly' && (
										<span className='text-green-600'>
											(Billed yearly at €228)
										</span>
									)}
								</p>
							</CardHeader>
							<CardContent className='space-y-3 flex-grow'>
								{PRO_FEATURES.map(f => (
									<div key={f} className='flex items-start gap-2'>
										<Check className='h-4 w-4 text-green-600 shrink-0 mt-1' />
										<span className='text-sm'>{f}</span>
									</div>
								))}
							</CardContent>
							<CardFooter>
								<Button className='w-full' asChild>
									<Link
										href={`/checkout?type=plan&plan=pro&billing=${billingPeriod}`}
									>
										Get Started with Pro
									</Link>
								</Button>
							</CardFooter>
						</Card>
					</div>

					{/* FAQ */}
					<section className='mt-16 max-w-3xl mx-auto'>
						<h2 className='font-headline text-center text-3xl font-bold mb-8'>
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
			</main>
			<Footer />
		</div>
	)
}
