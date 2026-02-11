'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
	useCollection,
	useDoc,
	useFirestore,
	useMemoFirebase,
	useUser,
} from '@/firebase'
import {
	followUser,
	incrementProfileView,
	unfollowUser,
} from '@/firebase/users'
import { useToast } from '@/hooks/use-toast'
import type { Prompt, PublicProfile } from '@/lib/types'
import { collection, query, where, limit, doc } from 'firebase/firestore'
import {
	Eye,
	Facebook,
	Instagram,
	Loader2,
	Package,
	Twitter,
	UserPlus,
	Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

function PublicProfileSkeleton() {
	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow pb-12'>
				<Skeleton className='h-48 sm:h-56 md:h-64 w-full bg-muted' />
				<div className='container mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='relative -mt-16 sm:-mt-20'>
						<div className='flex flex-col sm:flex-row sm:items-end gap-4'>
							<Skeleton className='h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-background shrink-0' />
							<div className='py-4 flex-grow space-y-2'>
								<Skeleton className='h-8 w-48' />
								<Skeleton className='h-5 w-32' />
							</div>
						</div>
					</div>
					<div className='mt-6 border-t pt-6 space-y-8'>
						<Skeleton className='h-6 w-3/4' />
						<Skeleton className='h-24 w-full' />
						<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
							<Skeleton className='h-48' />
							<Skeleton className='h-48' />
							<Skeleton className='h-48' />
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}

export default function PublicProfilePage() {
	const params = useParams<{ username: string }>()
	const firestore = useFirestore()
	const { user: loggedInUser } = useUser()
	const { toast } = useToast()
	const viewIncremented = useRef(false)
	const [isFollowLoading, setIsFollowLoading] = useState(false)

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

	// Increment view count
	useEffect(() => {
		if (
			userProfile?.uid &&
			loggedInUser?.uid !== userProfile.uid &&
			!viewIncremented.current
		) {
			incrementProfileView(firestore, userProfile.uid)
			viewIncremented.current = true
		}
	}, [firestore, userProfile, loggedInUser])

	// --- Follow/Unfollow State & Logic ---
	const amIFollowingRef = useMemoFirebase(() => {
		if (!firestore || !userProfile?.uid || !loggedInUser?.uid) return null
		return doc(
			firestore,
			'users',
			userProfile.uid,
			'followers',
			loggedInUser.uid,
		)
	}, [firestore, userProfile, loggedInUser])
	const { data: amIFollowingDoc } = useDoc(amIFollowingRef)
	const isFollowing = !!amIFollowingDoc

	const followersQuery = useMemoFirebase(() => {
		if (!firestore || !userProfile?.uid) return null
		return collection(firestore, 'users', userProfile.uid, 'followers')
	}, [firestore, userProfile])
	const { data: followersList } = useCollection(followersQuery)

	const followingQuery = useMemoFirebase(() => {
		if (!firestore || !userProfile?.uid) return null
		return collection(firestore, 'users', userProfile.uid, 'following')
	}, [firestore, userProfile])
	const { data: followingList } = useCollection(followingQuery)

	const handleFollowToggle = async () => {
		if (!loggedInUser || !userProfile) {
			toast({
				variant: 'destructive',
				title: 'Please sign in',
				description: 'You need to be logged in to follow users.',
			})
			return
		}
		setIsFollowLoading(true)
		try {
			if (isFollowing) {
				await unfollowUser(firestore, loggedInUser.uid, userProfile.uid)
				toast({ title: `You unfollowed ${userProfile.displayName}` })
			} else {
				await followUser(firestore, loggedInUser.uid, userProfile.uid)
				toast({ title: `You are now following ${userProfile.displayName}` })
			}
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description: error.message || 'Could not update follow status.',
			})
		} finally {
			setIsFollowLoading(false)
		}
	}

	if (profileLoading) {
		return <PublicProfileSkeleton />
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

	const socialLinks = [
		{
			href: userProfile.xProfile,
			icon: Twitter,
			label: 'X / Twitter',
		},
		{
			href: userProfile.instagramProfile,
			icon: Instagram,
			label: 'Instagram',
		},
		{
			href: userProfile.facebookProfile,
			icon: Facebook,
			label: 'Facebook',
		},
	].filter(link => link.href)

	const isOwnProfile = loggedInUser && loggedInUser.uid === userProfile.uid
	const followersCount = followersList?.length ?? userProfile.followers ?? 0
	const followingCount = followingList?.length ?? userProfile.following ?? 0
	const views = userProfile.views ?? 0
	const promptCount = prompts?.length ?? 0

	return (
		<div className='flex min-h-screen flex-col bg-muted/20'>
			<Header />
			<main className='flex-grow pb-12'>
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
								{!isOwnProfile && loggedInUser && (
									<Button
										onClick={handleFollowToggle}
										disabled={isFollowLoading}
									>
										{isFollowLoading ? (
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										) : null}
										{isFollowing ? 'Unfollow' : 'Follow'}
									</Button>
								)}
							</div>
						</div>
					</div>

					<div className='mt-6 border-t pt-6'>
						<div className='flex flex-wrap items-center gap-6 text-sm'>
							<div className='flex items-center gap-1.5'>
								<Users className='h-4 w-4 text-muted-foreground' />
								<span className='font-bold'>{followersCount}</span>
								<span className='text-muted-foreground'>Followers</span>
							</div>
							<div className='flex items-center gap-1.5'>
								<UserPlus className='h-4 w-4 text-muted-foreground' />
								<span className='font-bold'>{followingCount}</span>
								<span className='text-muted-foreground'>Following</span>
							</div>
							<div className='flex items-center gap-1.5'>
								<Eye className='h-4 w-4 text-muted-foreground' />
								<span className='font-bold'>{views}</span>
								<span className='text-muted-foreground'>Profile Views</span>
							</div>
							<div className='flex items-center gap-1.5'>
								<Package className='h-4 w-4 text-muted-foreground' />
								<span className='font-bold'>{promptCount}</span>
								<span className='text-muted-foreground'>Prompts</span>
							</div>
						</div>
					</div>

					<div className='mt-6 max-w-2xl'>
						{userProfile.description && (
							<p className='text-sm text-muted-foreground'>
								{userProfile.description}
							</p>
						)}
						{socialLinks.length > 0 && (
							<div className='flex items-center gap-4 mt-4'>
								{socialLinks.map(link => (
									<a
										key={link.label}
										href={link.href}
										target='_blank'
										rel='noopener noreferrer'
										className='text-muted-foreground hover:text-primary transition-colors'
										aria-label={link.label}
									>
										<link.icon className='h-5 w-5' />
									</a>
								))}
							</div>
						)}
					</div>

					<div className='mt-8'>
						<h2 className='text-xl font-bold mb-4'>Prompts by this user</h2>
						{promptsLoading ? (
							<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
								<Skeleton className='h-48' />
								<Skeleton className='h-48' />
								<Skeleton className='h-48' />
							</div>
						) : !prompts || prompts.length === 0 ? (
							<p className='text-muted-foreground py-8 text-center'>
								This user hasn't created any prompts yet.
							</p>
						) : (
							<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
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
			</main>
			<Footer />
		</div>
	)
}
