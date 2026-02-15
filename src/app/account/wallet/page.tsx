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
import type { PayoutRequest, UserProfile } from '@/lib/types'
import { collection, doc, query, where, orderBy } from 'firebase/firestore'
import { Coins, Banknote, History, Loader2, Info } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { useCollection } from '@/firebase/firestore/use-collection'
import { Badge } from '@/components/ui/badge'

const MIN_PAYOUT_CREDITS = 5000 // 50 EUR

function WalletSkeleton() {
	return (
		<div className='space-y-8'>
			<div className='grid md:grid-cols-2 gap-6'>
				<Skeleton className='h-36' />
				<Skeleton className='h-36' />
			</div>
			<Skeleton className='h-64' />
			<Skeleton className='h-48' />
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

	const payoutsQuery = useMemoFirebase(
		() =>
			user
				? query(
						collection(firestore, 'payouts'),
						where('userId', '==', user.uid),
						orderBy('requestedAt', 'desc'),
					)
				: null,
		[firestore, user],
	)
	const { data: payouts, isLoading: isPayoutsLoading } =
		useCollection<PayoutRequest>(payoutsQuery)

	const credits = userProfile?.credits ?? 0
	const earnings = userProfile?.earnings ?? 0
	const payoutStatus = userProfile?.payoutStatus ?? 'none'

	const canRequestPayout = earnings >= MIN_PAYOUT_CREDITS && payoutStatus === 'none'

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
								Manage your credits, earnings, and payouts.
							</p>
						</div>

						<div className='grid md:grid-cols-2 gap-6'>
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<Coins className='h-5 w-5 text-amber-500' />
										Purchased Credits
									</CardTitle>
									<CardDescription>
										Credits you buy to use on the platform.
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
									<CardTitle className='flex items-center gap-2'>
										<Banknote className='h-5 w-5 text-green-500' />
										Earnings
									</CardTitle>
									<CardDescription>
										Credits earned from your prompt sales.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<p className='text-4xl font-bold'>{earnings.toLocaleString()}</p>
								</CardContent>
								<CardFooter>
									<p className='text-xs text-muted-foreground'>
										Available for payout once you reach the minimum threshold.
									</p>
								</CardFooter>
							</Card>
						</div>

						<Card>
							<CardHeader>
								<CardTitle>Payouts</CardTitle>
								<CardDescription>
									Request a payout of your earnings. Minimum payout is{' '}
									{MIN_PAYOUT_CREDITS.toLocaleString()} credits (€
									{MIN_PAYOUT_CREDITS / 100}).
								</CardDescription>
							</CardHeader>
							<CardContent>
								<PayoutStatusInfo status={payoutStatus} />
							</CardContent>
							<CardFooter>
								<Button
									onClick={handleRequestPayout}
									disabled={!canRequestPayout || isRequestingPayout}
								>
									{isRequestingPayout && (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									)}
									Request Payout
								</Button>
							</CardFooter>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<History className='h-5 w-5' />
									Payout History
								</CardTitle>
								<CardDescription>
									A record of your past payout requests.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isPayoutsLoading ? (
									<Skeleton className='h-24 w-full' />
								) : !payouts || payouts.length === 0 ? (
									<p className='text-center text-sm text-muted-foreground py-8'>
										You have no payout history yet.
									</p>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Date</TableHead>
												<TableHead>Amount</TableHead>
												<TableHead>Status</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{payouts.map(payout => (
												<TableRow key={payout.id}>
													<TableCell>
														{format(
															payout.requestedAt.toDate(),
															'dd MMM, yyyy',
														)}
													</TableCell>
													<TableCell>
														{payout.amountCurrency.toLocaleString('de-DE', {
															style: 'currency',
															currency: 'EUR',
														})}
													</TableCell>
													<TableCell>
														<Badge
															variant={
																payout.status === 'paid' ||
																payout.status === 'approved'
																	? 'default'
																	: payout.status === 'rejected'
																		? 'destructive'
																		: 'secondary'
															}
															className='capitalize'
														>
															{payout.status}
														</Badge>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}