'use client'

import AccountSidebar from '@/components/account/account-sidebar'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	useCollection,
	useDoc,
	useFirestore,
	useMemoFirebase,
	useUser,
} from '@/firebase'
import type { Notification, UserProfile } from '@/lib/types'
import { collection, doc, orderBy, query } from 'firebase/firestore'
import {
	Bell,
	Coins,
	FileSpreadsheet,
	Heart,
	Loader2,
	MessageSquare,
	UserPlus,
	Banknote,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

function NotificationsSkeleton() {
	return (
		<div className='space-y-4'>
			<Skeleton className='h-10 w-48' />
			<Skeleton className='h-4 w-64' />
			<Card>
				<CardHeader>
					<Skeleton className='h-6 w-1/3' />
				</CardHeader>
				<CardContent>
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='w-12 text-center'>Type</TableHead>
									<TableHead>Event</TableHead>
									<TableHead>Credits</TableHead>
									<TableHead>Date</TableHead>
									<TableHead className='text-right'>Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{Array.from({ length: 3 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell className='text-center'>
											<Skeleton className='h-6 w-6 rounded-full mx-auto' />
										</TableCell>
										<TableCell>
											<Skeleton className='h-4 w-48' />
										</TableCell>
										<TableCell>
											<Skeleton className='h-4 w-12' />
										</TableCell>
										<TableCell>
											<Skeleton className='h-4 w-20' />
										</TableCell>
										<TableCell className='text-right'>
											<Skeleton className='h-4 w-16' />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
	switch (type) {
		case 'sale':
			return <Coins className='h-5 w-5 text-amber-500' />
		case 'follow':
			return <UserPlus className='h-5 w-5 text-blue-500' />
		case 'comment':
			return <MessageSquare className='h-5 w-5 text-green-500' />
		case 'like':
			return <Heart className='h-5 w-5 text-red-500' />
		case 'payout':
			return <Banknote className='h-5 w-5 text-indigo-500' />
		default:
			return <Bell className='h-5 w-5 text-muted-foreground' />
	}
}

export default function NotificationsPage() {
	const { user, isUserLoading } = useUser()
	const firestore = useFirestore()
	const router = useRouter()

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile, isLoading: isProfileLoading } =
		useDoc<UserProfile>(userProfileRef)
	const credits = userProfile?.credits ?? 0

	const notificationsQuery = useMemoFirebase(
		() =>
			user
				? query(
						collection(firestore, 'users', user.uid, 'notifications'),
						orderBy('createdAt', 'desc'),
					)
				: null,
		[firestore, user],
	)
	const { data: notifications, isLoading: areNotificationsLoading } =
		useCollection<Notification>(notificationsQuery)

	useEffect(() => {
		if (!isUserLoading && !user) {
			router.replace('/')
		}
	}, [user, isUserLoading, router])

	const getCreditsFromNotification = (notification: Notification) => {
		if (notification.type === 'sale') {
			const match = notification.body.match(/earned (\d+) credits/)
			if (match && match[1]) {
				return `+${match[1]}`
			}
		}
		return null
	}

	const isLoading = isUserLoading || isProfileLoading || areNotificationsLoading

	if (isLoading && !notifications) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8'>
					<div className='flex flex-col lg:flex-row gap-8'>
						<div className='w-full lg:w-56 shrink-0'>
							<Skeleton className='h-48 w-full' />
						</div>
						<div className='flex-1 min-w-0'>
							<NotificationsSkeleton />
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
					<div className='flex-1 min-w-0'>
						<h1 className='font-headline text-3xl md:text-4xl font-bold mb-2'>
							Notifications
						</h1>
						<p className='text-muted-foreground mb-8'>
							Stay updated with your sales, comments, and other activity.
						</p>

						<Card>
							<CardHeader>
								<CardTitle>Recent Activity</CardTitle>
							</CardHeader>
							<CardContent>
								{!notifications || notifications.length === 0 ? (
									<div className='flex flex-col items-center justify-center py-16 text-center border rounded-lg'>
										<div className='rounded-full bg-muted p-6 mb-4'>
											<Bell className='h-14 w-14 text-muted-foreground' />
										</div>
										<h3 className='text-xl font-semibold mb-2'>
											No notifications yet
										</h3>
										<p className='text-muted-foreground max-w-sm mb-6'>
											When something happens, you'll be notified here.
										</p>
										<Button asChild variant='outline'>
											<Link href='/'>Explore prompts</Link>
										</Button>
									</div>
								) : (
									<div className='rounded-md border'>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className='w-12 text-center'>Type</TableHead>
													<TableHead>Event / Description</TableHead>
													<TableHead>Credits</TableHead>
													<TableHead>Date</TableHead>
													<TableHead className='text-right'>Action</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{notifications.map(notif => {
													const credits = getCreditsFromNotification(notif)
													return (
														<TableRow
															key={notif.id}
															className={cn(!notif.isRead && 'bg-muted/50')}
														>
															<TableCell className='text-center'>
																<NotificationIcon type={notif.type} />
															</TableCell>
															<TableCell>
																<p className='font-medium'>{notif.title}</p>
																<p className='text-sm text-muted-foreground'>
																	{notif.body}
																</p>
															</TableCell>
															<TableCell
																className={cn(
																	credits && 'font-bold text-green-600',
																)}
															>
																{credits ?? '—'}
															</TableCell>
															<TableCell className='text-muted-foreground'>
																{notif.createdAt
																	? formatDistanceToNow(
																			notif.createdAt.toDate(),
																			{ addSuffix: true },
																		)
																	: ''}
															</TableCell>
															<TableCell className='text-right'>
																{notif.link && (
																	<Button
																		variant='link'
																		asChild
																		className='p-0 h-auto'
																	>
																		<Link href={notif.link}>Details</Link>
																	</Button>
																)}
															</TableCell>
														</TableRow>
													)
												})}
											</TableBody>
										</Table>
									</div>
								)}
							</CardContent>
							{notifications && notifications.length > 0 && (
								<CardFooter>
									<Button variant='outline'>
										<FileSpreadsheet className='mr-2 h-4 w-4' />
										Export to Table
									</Button>
								</CardFooter>
							)}
						</Card>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
