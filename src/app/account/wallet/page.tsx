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
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import { requestPayout } from '@/firebase/users'
import { useToast } from '@/hooks/use-toast'
import type { UserProfile } from '@/lib/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { doc } from 'firebase/firestore'
import { Banknote, CheckCircle, Coins, Info, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const MIN_PAYOUT_CREDITS = 5000 // 50 EUR

const createPayoutSchema = (maxAmount: number) =>
	z.object({
		amount: z.coerce
			.number({ invalid_type_error: 'Please enter a valid number.' })
			.int()
			.positive({ message: 'Amount must be positive.' })
			.min(MIN_PAYOUT_CREDITS, {
				message: `Minimum payout is ${MIN_PAYOUT_CREDITS.toLocaleString()} credits.`,
			})
			.max(maxAmount, {
				message: `Cannot exceed your available balance of ${maxAmount.toLocaleString()}.`,
			}),
	})

type PayoutFormValues = z.infer<ReturnType<typeof createPayoutSchema>>

function WalletSkeleton() {
	return (
		<div className='space-y-8'>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
				<Skeleton className='h-36' />
				<Skeleton className='h-36' />
			</div>
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
		},
		approved: {
			icon: <CheckCircle className='h-4 w-4 text-blue-500' />,
			title: 'Payout Approved',
			description:
				'Your request has been approved and will be processed soon.',
		},
		processing: {
			icon: <Loader2 className='h-4 w-4 animate-spin text-blue-500' />,
			title: 'Payout Processing',
			description:
				'Your payout has been approved and is being processed. Funds should arrive shortly.',
		},
		paid: {
			icon: <Banknote className='h-4 w-4 text-green-500' />,
			title: 'Payout Sent',
			description: 'Your earnings have been sent to your connected account.',
		},
		rejected: {
			icon: <Info className='h-4 w-4 text-destructive' />,
			title: 'Payout Rejected',
			description:
				'There was an issue with your payout request. Please contact support.',
		},
	}

	if (!status || status === 'none') {
		return null
	}

	const currentStatus = statusMap[status]

	if (!currentStatus) {
		return null
	}

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

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile, isLoading: isProfileLoading } =
		useDoc<UserProfile>(userProfileRef)

	const credits = userProfile?.credits ?? 0
	const earnings = userProfile?.earnings ?? 0
	const payoutStatus = userProfile?.payoutStatus ?? 'none'

	const payoutSchema = createPayoutSchema(credits)

	const form = useForm<PayoutFormValues>({
		resolver: zodResolver(payoutSchema),
		defaultValues: {
			amount: Math.min(credits, MIN_PAYOUT_CREDITS),
		},
		mode: 'onChange',
	})

	const amount = form.watch('amount')

	useEffect(() => {
		if (!isUserLoading && !user) {
			router.replace('/')
		}
	}, [user, isUserLoading, router])

	async function onSubmit(data: PayoutFormValues) {
		if (!user || !firestore) return

		try {
			await requestPayout(firestore, user.uid, data.amount)
			toast({
				title: 'Payout Requested',
				description: `Your request for ${data.amount.toLocaleString()} credits has been submitted.`,
			})
			form.reset({ amount: 0 })
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error Requesting Payout',
				description: error.message,
			})
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

						<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<Coins className='h-5 w-5 text-amber-500' />
										Total Credit Balance
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className='text-4xl font-bold'>{credits.toLocaleString()}</p>
									<p className='text-xs text-muted-foreground mt-1'>
										Includes purchased and earned credits.
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<Banknote className='h-5 w-5 text-green-600' />
										Available for Payout
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className='text-4xl font-bold'>{earnings.toLocaleString()}</p>
									<p className='text-xs text-muted-foreground mt-1'>
										Credits earned from your sales.
									</p>
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader>
								<CardTitle>Request a Payout</CardTitle>
								<CardDescription>
									Withdraw your credits. 100 credits = €1.00. Minimum payout is{' '}
									{MIN_PAYOUT_CREDITS.toLocaleString()} credits (€
									{(MIN_PAYOUT_CREDITS / 100).toFixed(2)}).
								</CardDescription>
							</CardHeader>
							<Form {...form}>
								<form onSubmit={form.handleSubmit(onSubmit)}>
									<CardContent className='space-y-6'>
										<PayoutStatusInfo status={payoutStatus} />
										{payoutStatus === 'none' ||
										payoutStatus === 'paid' ||
										payoutStatus === 'rejected' ? (
											<FormField
												control={form.control}
												name='amount'
												render={({ field }) => (
													<FormItem>
														<FormLabel>Amount to Withdraw (credits)</FormLabel>
														<div className='flex items-center gap-4'>
															<FormControl>
																<Input
																	type='number'
																	placeholder='e.g., 5000'
																	className='max-w-xs'
																	{...field}
																/>
															</FormControl>
															<div className='font-semibold text-lg'>
																= €{(amount / 100).toFixed(2)}
															</div>
														</div>

														<Slider
															value={[field.value]}
															onValueChange={vals =>
																field.onChange(vals[0] ?? 0)
															}
															min={MIN_PAYOUT_CREDITS}
															max={credits}
															step={100}
															disabled={
																form.formState.isSubmitting ||
																credits < MIN_PAYOUT_CREDITS
															}
															className='pt-2'
														/>
														<FormMessage />
													</FormItem>
												)}
											/>
										) : null}
									</CardContent>
									{payoutStatus === 'none' ||
									payoutStatus === 'paid' ||
									payoutStatus === 'rejected' ? (
										<CardFooter>
											<Button
												type='submit'
												disabled={
													form.formState.isSubmitting ||
													!form.formState.isValid
												}
											>
												{form.formState.isSubmitting && (
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												)}
												Request Payout
											</Button>
										</CardFooter>
									) : null}
								</form>
							</Form>
						</Card>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
