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
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination'
import {
	useCollection,
	useDoc,
	useFirestore,
	useMemoFirebase,
	useUser,
} from '@/firebase'
import type { Notification } from '@/lib/types'
import { collection, doc, orderBy, query } from 'firebase/firestore'
import {
	Bell,
	Coins,
	Heart,
	Loader2,
	MessageSquare,
	UserPlus,
	Banknote,
	Star,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
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
								</TableRow>
							</TableHeader>
							<TableBody>
								{Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell className='text-center'>
											<Skeleton className='h-6 w-6 rounded-full mx-auto' />
										</TableCell>
										<TableCell>
											<Skeleton className='h-4 w-48' />
											<Skeleton className='h-4 w-64 mt-2' />
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
			return <Coins className='h-5 w-5 text-amber-500 mx-auto' />
		case 'follow':
			return <UserPlus className='h-5 w-5 text-blue-500 mx-auto' />
		case 'comment':
			return <MessageSquare className='h-5 w-5 text-green-500 mx-auto' />
		case 'like':
			return <Heart className='h-5 w-5 text-red-500 mx-auto' />
		case 'payout':
			return <Banknote className='h-5 w-5 text-indigo-500 mx-auto' />
		default:
			return <Bell className='h-5 w-5 text-muted-foreground mx-auto' />
	}
}

export default function NotificationsPage() {
	const { user, isUserLoading } = useUser()
	const firestore = useFirestore()
	const router = useRouter()
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage] = useState(10)

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile, isLoading: isProfileLoading } =
		useDoc(userProfileRef)
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

	const pageCount = notifications
		? Math.ceil(notifications.length / itemsPerPage)
		: 0
	const paginatedNotifications = useMemo(() => {
		if (!notifications) return []
		return notifications.slice(
			(currentPage - 1) * itemsPerPage,
			currentPage * itemsPerPage,
		)
	}, [notifications, currentPage, itemsPerPage])

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
								{!paginatedNotifications ||
								paginatedNotifications.length === 0 ? (
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
													<TableHead>Event</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{paginatedNotifications.map(notif => {
													let eventDisplay: React.ReactNode = notif.title
													const promptTitleMatch = notif.body.match(/"(.*?)"/)
													let bodyWithLink: React.ReactNode = notif.body

													if (promptTitleMatch && notif.link) {
														const promptTitle = promptTitleMatch[1]
														const parts = notif.body.split(`"${promptTitle}"`)
														bodyWithLink = (
															<>
																{parts[0]}
																<Link
																	href={notif.link}
																	className='font-semibold text-primary hover:underline'
																>
																	"{promptTitle}"
																</Link>
																{parts[1]}
															</>
														)
													}

													switch (notif.type) {
														case 'sale':
															const creditsMatch = notif.body.match(/(\d+)\s*credits/i)
															eventDisplay = (
																<>
																	<span>Prompt Sold</span>
																	{creditsMatch && (
																		<span className='font-bold text-green-600 flex items-center gap-1'>
																			+ <Coins className='h-4 w-4' />{' '}
																			{creditsMatch[1]}
																		</span>
																	)}
																</>
															)
															break
														case 'comment':
															const ratingMatch = notif.body.match(/(\d+)-star/i)
															const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0
															eventDisplay = (
																<>
																	<span>New Review</span>
																	{rating > 0 && (
																		<div className='flex items-center gap-0.5'>
																			{Array.from({ length: 5 }).map((_, i) => (
																				<Star
																					key={i}
																					className={cn(
																						'h-4 w-4',
																						i < rating
																							? 'text-yellow-400 fill-yellow-400'
																							: 'text-muted-foreground/30',
																					)}
																				/>
																			))}
																		</div>
																	)}
																</>
															)
															break
														case 'follow':
															const followerMatch = notif.body.match(/^(.*?)\s+is now following you/i)
															eventDisplay = (
																<>
																	<span>New Follower:</span>
																	<span className='font-semibold'>
																		{followerMatch ? followerMatch[1] : 'Someone'}
																	</span>
																</>
															)
															break
														case 'like':
															eventDisplay = 'New Like'
															break
														default:
															eventDisplay = notif.title
															break
													}

													return (
														<TableRow
															key={notif.id}
															className={cn(!notif.isRead && 'bg-muted/50')}
														>
															<TableCell className='text-center align-middle'>
																<NotificationIcon type={notif.type} />
															</TableCell>
															<TableCell>
																<div className='flex items-center gap-2 font-medium'>
																	{eventDisplay}
																	<span className='text-xs text-muted-foreground font-normal whitespace-nowrap'>
																		{notif.createdAt
																			? formatDistanceToNow(
																					notif.createdAt.toDate(),
																					{ addSuffix: true },
																				)
																			: ''}
																	</span>
																</div>
																<p className='text-sm text-muted-foreground mt-1'>
																	{bodyWithLink}
																</p>
															</TableCell>
														</TableRow>
													)
												})}
											</TableBody>
										</Table>
									</div>
								)}
							</CardContent>
							{pageCount > 1 && (
								<CardFooter className='justify-end border-t pt-4'>
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
													disabled={currentPage === 1}
												/>
											</PaginationItem>
											{Array.from({ length: pageCount }, (_, i) => i + 1).map(
												page => (
													<PaginationItem key={page}>
														<PaginationLink
															onClick={() => setCurrentPage(page)}
															isActive={currentPage === page}
														>
															{page}
														</PaginationLink>
													</PaginationItem>
												),
											)}
											<PaginationItem>
												<PaginationNext
													onClick={() =>
														setCurrentPage(p => Math.min(pageCount, p + 1))
													}
													disabled={currentPage === pageCount}
												/>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
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
