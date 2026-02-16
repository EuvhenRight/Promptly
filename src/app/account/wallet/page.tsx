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
import { Skeleton } from '@/components/ui/skeleton'
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import { requestPayout } from '@/firebase/users'
import { useToast } from '@/hooks/use-toast'
import type { UserProfile } from '@/lib/types'
import { doc } from 'firebase/firestore'
import { Banknote, Coins, Info, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const MIN_PAYOUT_CREDITS = 5000 // 50 EUR

function WalletSkeleton() {
	return (
		<div className='space-y-8'>
			<Skeleton className='h-36' />
			<Skeleton className='h-64' />
		</div>
	)
}

function PayoutStatusInfo({ status }: { status: UserProfile['payoutStatus'] }) {
	const statusMap = {
		pending: {
			icon: <Loader2 className='h-4 w-4 animate-spin text-yellow-500' />,
			title: 'Payout Pending',
			description:
				'Your request is awaiting review. This usually takes 3-5 business days.',
			variant: 'default',
		},
		processing: {
			icon: <Loader2 className='h-4 w-4 animate-spin text-blue-500' />,
			title: 'Payout Processing',
			description:
				'Your payout has been approved and is being processed. Funds should arrive shortly.',
			variant: 'default',
		},
		paid: {
			icon: <Banknote className='h-4 w-4 text-green-500' />,
			title: 'Payout Sent',
			description: 'Your earnings have been sent to your connected account.',
			variant: 'default',
		},
		rejected: {
			icon: <Info className='h-4 w-4 text-destructive' />,
			title: 'Payout Rejected',
			description:
				'There was an issue with your payout request. Please contact support.',
			variant: 'destructive',
		},
	}

	if (!status || status === 'none') {
		return null
	}

	const currentStatus = statusMap[status]

	return (
		<Card className='bg-muted/50'>
			<CardHeader className='flex-row items-start gap-4 space-y-0'>
				<div className='mt-1'>{currentStatus.icon}</div>
				<div className='flex-1'>
					<CardTitle>{currentStatus.title}</CardTitle>
					<CardDescription>{currentStatus.description}</CardDescription>
				</div>
			</CardHeader>
		</Card>
	)
}

export default function WalletPage() {
	const { user, isUserLoading } = useUser()
	const firestore = useFirestore()
	const router = useRouter()
	const { toast } = useToast()
	const [isRequestingPayout, setIsRequestingPayout] = useState(false)

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile, isLoading: isProfileLoading } =
		useDoc<UserProfile>(userProfileRef)

	const credits = userProfile?.credits ?? 0
	const earnings = userProfile?.earnings ?? 0
	const payoutStatus = userProfile?.payoutStatus ?? 'none'

	const canRequestPayout =
		earnings >= MIN_PAYOUT_CREDITS && payoutStatus === 'none'

	useEffect(() => {
		if (!isUserLoading && !user) {
			router.replace('/')
		}
	}, [user, isUserLoading, router])

	const handleRequestPayout = async () => {
		if (!user || !firestore || !canRequestPayout) return

		setIsRequestingPayout(true)
		try {
			await requestPayout(firestore, user.uid)
			toast({
				title: 'Payout Requested',
				description:
					'Your request has been submitted for review. This can take up to 5 business days.',
			})
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error Requesting Payout',
				description: error.message,
			})
		} finally {
			setIsRequestingPayout(false)
		}
	}

	if (isUserLoading || isProfileLoading) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8'>
					<div className='flex flex-col lg:flex-row gap-8'>
						<Skeleton className='h-48 w-full lg:w-56 shrink-0' />
						<div className='flex-1 min-w-0'>
							<WalletSkeleton />
						</div>
					</div>
				</main>
				<Footer />
			</div>
		)
	}

	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8'>
				<div className='flex flex-col lg:flex-row gap-8'>
					<AccountSidebar credits={credits} />
					<div className='flex-1 min-w-0 space-y-8'>
						<div>
							<h1 className='font-headline text-3xl font-bold'>Wallet</h1>
							<p className='mt-1 text-muted-foreground'>
								Manage your credits and request payouts.
							</p>
						</div>

						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Coins className='h-5 w-5 text-amber-500' />
									Total Credit Balance
								</CardTitle>
								<CardDescription>
									Your total balance for purchasing prompts, including both
									purchased and earned credits.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className='text-4xl font-bold'>{credits.toLocaleString()}</p>
							</CardContent>
							<CardFooter>
								<Button asChild>
									<Link href='/account/plans#credits'>Buy More Credits</Link>
								</Button>
							</CardFooter>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Payouts</CardTitle>
								<CardDescription>
									Request a payout of your earnings. Minimum payout is{' '}
									{MIN_PAYOUT_CREDITS.toLocaleString()} credits (€
									{MIN_PAYOUT_CREDITS / 100}).
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='rounded-lg border p-4'>
									<div className='flex items-center justify-between'>
										<span className='text-muted-foreground'>
											Available for Payout
										</span>
										<span className='font-bold text-lg'>
											{earnings.toLocaleString()}
										</span>
									</div>
								</div>
								<PayoutStatusInfo status={payoutStatus} />
							</CardContent>
							<CardFooter className='flex-col items-start gap-4'>
								<Button
									onClick={handleRequestPayout}
									disabled={!canRequestPayout || isRequestingPayout}
								>
									{isRequestingPayout && (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									)}
									Request Payout
								</Button>
								{!canRequestPayout &&
									payoutStatus === 'none' &&
									earnings < MIN_PAYOUT_CREDITS && (
										<p className='text-sm text-muted-foreground'>
											You have {earnings.toLocaleString()} credits in earnings. You
											need at least {MIN_PAYOUT_CREDITS.toLocaleString()} to
											request a payout.
										</p>
									)}
							</CardFooter>
						</Card>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
