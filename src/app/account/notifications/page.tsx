'use client'

import AccountSidebar from '@/components/account/account-sidebar'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
	FileText,
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
				<CardContent className='space-y-4'>
					<div className='flex items-center gap-4 p-4'>
						<Skeleton className='h-8 w-8 rounded-full' />
						<div className='flex-1 space-y-2'>
							<Skeleton className='h-4 w-3/4' />
							<Skeleton className='h-4 w-1/2' />
						</div>
					</div>
					<div className='flex items-center gap-4 p-4'>
						<Skeleton className='h-8 w-8 rounded-full' />
						<div className='flex-1 space-y-2'>
							<Skeleton className='h-4 w-2/3' />
							<Skeleton className='h-4 w-1/3' />
						</div>
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
									<div className='flex flex-col items-center justify-center py-16 text-center'>
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
									<div className='space-y-2'>
										{notifications.map(notif => (
											<div
												key={notif.id}
												className={cn(
													'flex items-start gap-4 p-4 rounded-lg transition-colors',
													!notif.isRead && 'bg-muted/50',
												)}
											>
												<div
													className={cn(
														'mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0',
														!notif.isRead ? 'bg-background' : 'bg-muted',
													)}
												>
													<NotificationIcon type={notif.type} />
												</div>
												<div className='flex-1'>
													<p className='font-semibold'>{notif.title}</p>
													<p className='text-sm text-muted-foreground'>
														{notif.body}
													</p>
													<div className='flex items-center gap-4 mt-2'>
														{notif.link && (
															<Link
																href={notif.link}
																className='text-sm font-medium text-primary hover:underline flex items-center gap-1'
															>
																<FileText className='h-4 w-4' /> View Details
															</Link>
														)}
														<span className='text-xs text-muted-foreground'>
															{notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), {
																addSuffix: true,
															}) : ''}
														</span>
													</div>
												</div>
											</div>
										))}
									</div>
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
