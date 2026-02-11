'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import type { Prompt, PublicProfile } from '@/lib/types'
import { collection, query, where, limit } from 'firebase/firestore'
import { Eye, Globe } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'

function PublicProfileSkeleton() {
	return (
		<div className='space-y-8'>
			<div className='relative h-64 w-full bg-muted rounded-lg'></div>
			<div className='-mt-20 px-8'>
				<div className='flex items-end gap-4'>
					<Skeleton className='h-32 w-32 rounded-full border-4 border-background' />
					<div className='pb-4 space-y-2'>
						<Skeleton className='h-8 w-48' />
						<Skeleton className='h-5 w-32' />
					</div>
				</div>
			</div>
			<div className='px-8 space-y-4'>
				<Skeleton className='h-24 w-full' />
				<Skeleton className='h-48 w-full' />
			</div>
		</div>
	)
}

export default function PublicProfilePage() {
	const params = useParams<{ username: string }>()
	const firestore = useFirestore()
	const { user: loggedInUser } = useUser()

	const profileQuery = useMemoFirebase(
		() =>
			firestore && params.username
				? query(
						collection(firestore, 'public-profiles'),
						where('username', '==', params.username),
						limit(1),
					)
				: null,
		[firestore, params.username],
	)

	const { data: profiles, isLoading: profileLoading } =
		useCollection<PublicProfile>(profileQuery)

	const userProfile = profiles?.[0]

	const promptsQuery = useMemoFirebase(
		() =>
			firestore && userProfile?.uid
				? query(
						collection(firestore, 'prompts'),
						where('authorId', '==', userProfile.uid),
					)
				: null,
		[firestore, userProfile?.uid],
	)
	const { data: prompts, isLoading: promptsLoading } =
		useCollection<Prompt>(promptsQuery)

	if (profileLoading) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8 max-w-4xl'>
					<PublicProfileSkeleton />
				</main>
				<Footer />
			</div>
		)
	}

	if (!userProfile) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8 text-center'>
					<h1 className='text-2xl font-bold'>User not found</h1>
					<p className='text-muted-foreground'>
						The profile for @{params.username} could not be found.
					</p>
					<Button asChild className='mt-4'>
						<Link href='/'>Go to Homepage</Link>
					</Button>
				</main>
				<Footer />
			</div>
		)
	}

	const isOwnProfile = loggedInUser && loggedInUser.uid === userProfile.uid

	return (
		<div className='flex min-h-screen flex-col bg-muted/20'>
			<Header />
			<main className='flex-grow'>
				<div className='relative h-48 sm:h-56 md:h-64 w-full bg-muted'>
					{userProfile.coverImageURL && (
						<Image
							src={userProfile.coverImageURL}
							alt={`${userProfile.displayName}'s cover image`}
							fill
							className='object-cover'
							priority
							unoptimized
						/>
					)}
					<div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
				</div>
				<div className='container mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='relative -mt-16 sm:-mt-20'>
						<div className='flex flex-col sm:flex-row sm:items-end gap-4'>
							<Avatar className='h-28 w-28 sm:h-32 sm:w-32 border-4 border-background bg-background shrink-0'>
								<AvatarImage
									src={userProfile.photoURL}
									alt={userProfile.displayName}
								/>
								<AvatarFallback className='text-4xl'>
									{userProfile.displayName.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<div className='py-4 flex-grow'>
								<h1 className='text-3xl font-bold font-headline'>
									{userProfile.displayName}
								</h1>
								<p className='text-muted-foreground'>@{userProfile.username}</p>
							</div>
							<div className='pb-4 flex gap-2'>
								{!isOwnProfile && (
									<>
										<Button>Follow</Button>
										<Button variant='outline'>Message</Button>
									</>
								)}
							</div>
						</div>
					</div>

					<div className='mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8'>
						<div className='lg:col-span-1 space-y-6'>
							<Card>
								<CardContent className='pt-6 space-y-4'>
									{userProfile.description && <p>{userProfile.description}</p>}
									<div className='flex items-center gap-4 text-sm text-muted-foreground'>
										<div className='flex items-center gap-1.5'>
											<Eye className='h-4 w-4' />
											<span>3.2k views</span>
										</div>
										<div className='flex items-center gap-1.5'>
											<Globe className='h-4 w-4' />
											<span>promptly.com</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className='lg:col-span-2'>
							<h2 className='text-xl font-bold mb-4'>Prompts by this user</h2>
							{promptsLoading ? (
								<div className='grid gap-4 sm:grid-cols-2'>
									<Skeleton className='h-48' />
									<Skeleton className='h-48' />
								</div>
							) : !prompts || prompts.length === 0 ? (
								<p className='text-muted-foreground py-8 text-center'>
									This user hasn't created any prompts yet.
								</p>
							) : (
								<div className='grid gap-4 sm:grid-cols-2'>
									{prompts.map(prompt => {
										const img = prompt.images?.[0]
										return (
											<Link key={prompt.id} href={`/prompt/${prompt.id}`}>
												<Card className='overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg'>
													<div className='relative aspect-video bg-muted'>
														{img && (
															<Image
																src={img}
																alt={prompt.title}
																fill
																className='object-cover'
																unoptimized
															/>
														)}
														<div className='absolute bottom-2 right-2'>
															<Badge>{`$${prompt.price}`}</Badge>
														</div>
													</div>
													<CardContent className='p-3'>
														<h3 className='font-semibold truncate'>
															{prompt.title}
														</h3>
													</CardContent>
												</Card>
											</Link>
										)
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
