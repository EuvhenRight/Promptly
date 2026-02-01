'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/firebase'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function NotificationsSkeleton() {
	return (
		<div className='space-y-4'>
			<Skeleton className='h-10 w-48' />
			<Skeleton className='h-4 w-64' />
			<Card>
				<CardContent className='py-16'>
					<Skeleton className='h-24 w-24 mx-auto rounded-full' />
					<Skeleton className='h-6 w-48 mx-auto mt-4' />
					<Skeleton className='h-4 w-72 mx-auto mt-2' />
				</CardContent>
			</Card>
		</div>
	)
}

export default function NotificationsPage() {
	const { user, isUserLoading } = useUser()
	const router = useRouter()

	useEffect(() => {
		if (!isUserLoading && !user) {
			router.replace('/')
		}
	}, [user, isUserLoading, router])

	if (isUserLoading || !user) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8'>
					<NotificationsSkeleton />
				</main>
				<Footer />
			</div>
		)
	}

	// Empty state - no notifications yet
	const hasNotifications = false

	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8'>
				{/* Main heading */}
				<h1 className='font-headline text-3xl md:text-4xl font-bold mb-2'>
					Notifications
				</h1>
				<p className='text-muted-foreground mb-8'>
					Stay updated with your activity
				</p>

				{/* Content */}
				{hasNotifications ? (
					<Card>
						<CardHeader>
							<CardTitle>Recent activity</CardTitle>
							<CardDescription>
								Likes, comments, and follows from other users
							</CardDescription>
						</CardHeader>
						<CardContent>
							{/* Notification items would render here */}
							<div className='space-y-4'>
								{/* Example structure for future notifications:
								<div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50">
									<Heart className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
									<div>
										<p><strong>User</strong> liked your prompt</p>
										<p className="text-sm text-muted-foreground">2 hours ago</p>
									</div>
								</div>
								*/}
							</div>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardContent className='flex flex-col items-center justify-center py-16 text-center'>
							<div className='rounded-full bg-muted p-6 mb-4'>
								<Bell className='h-14 w-14 text-muted-foreground' />
							</div>
							<h3 className='text-xl font-semibold mb-2'>
								No notifications yet
							</h3>
							<p className='text-muted-foreground max-w-sm mb-6'>
								When you receive likes, comments, or followers, they&apos;ll
								appear here
							</p>
							<Button asChild variant='outline'>
								<Link href='/'>Explore prompts</Link>
							</Button>
						</CardContent>
					</Card>
				)}
			</main>
			<Footer />
		</div>
	)
}
