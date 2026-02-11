'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	useCollection,
	useDoc,
	useFirestore,
	useMemoFirebase,
	useUser,
} from '@/firebase'
import type { Prompt, UserProfile } from '@/lib/types'
import { collection, doc, documentId, query, where } from 'firebase/firestore'
import {
	CreditCard,
	DollarSign,
	Edit2,
	Eye,
	Heart,
	Package,
	Star,
	TrendingUp,
	UserPlus,
	Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import AccountSidebar from '@/components/account/account-sidebar'

function ProfileSkeleton() {
	return (
		<div className='flex flex-col lg:flex-row gap-8'>
			<div className='w-full lg:w-56 shrink-0'>
				<Skeleton className='h-48 w-full' />
			</div>
			<div className='flex-1 min-w-0 space-y-8'>
				<div className='flex flex-col sm:flex-row items-start sm:items-center gap-6'>
					<Skeleton className='h-24 w-24 rounded-full' />
					<div className='space-y-2'>
						<Skeleton className='h-8 w-48' />
						<Skeleton className='h-4 w-64' />
					</div>
				</div>
				<div className='grid gap-6 md:grid-cols-2'>
					<Skeleton className='h-48 rounded-lg' />
					<Skeleton className='h-48 rounded-lg' />
				</div>
			</div>
		</div>
	)
}

function EmptyTabContent({
	icon: Icon,
	title,
	description,
	actionLabel,
}: {
	icon: React.ElementType
	title: string
	description: string
	actionLabel: string
}) {
	return (
		<div className='text-center py-16 text-muted-foreground'>
			<Icon className='h-14 w-14 mx-auto mb-4 opacity-50' />
			<p className='font-medium text-foreground'>{title}</p>
			<p className='mt-2'>{description}</p>
			<Button asChild variant='outline' className='mt-6'>
				<Link href='/'>{actionLabel}</Link>
			</Button>
		</div>
	)
}

function PromptGrid({ prompts }: { prompts: Prompt[] }) {
	return (
		<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
			{prompts.map(prompt => {
				const img = prompt.images?.[0]
				return (
					<Link
						key={prompt.id}
						href={`/prompt/${prompt.id}`}
						className='group block'
					>
						<Card className='overflow-hidden transition-colors hover:bg-muted/50'>
							<div className='relative aspect-video bg-muted'>
								{img && (
									<Image
										src={img}
										alt={prompt.title}
										fill
										className='object-cover group-hover:scale-105 transition-transform duration-300'
										unoptimized
									/>
								)}
							</div>
							<CardContent className='p-3'>
								<p className='font-medium line-clamp-1 group-hover:text-primary'>
									{prompt.title}
								</p>
								<p className='text-sm text-muted-foreground'>
									{prompt.price === 0 ? 'Free' : `$${prompt.price.toFixed(2)}`}
								</p>
							</CardContent>
						</Card>
					</Link>
				)
			})}
		</div>
	)
}

export default function ProfilePage() {
	const { user, isUserLoading } = useUser()
	const firestore = useFirestore()
	const router = useRouter()
	const [showFeaturedImage, setShowFeaturedImage] = useState<boolean | null>(null)

	const credits = 10 // Placeholder

	useEffect(() => {
		const storedPreference = localStorage.getItem('showFeaturedImage')
		setShowFeaturedImage(
			storedPreference !== null ? JSON.parse(storedPreference) : true,
		)
	}, [])

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile } = useDoc<UserProfile>(userProfileRef)

	const purchasedPromptsQuery = useMemoFirebase(() => {
		if (
			!firestore ||
			!userProfile?.purchasedPrompts ||
			userProfile.purchasedPrompts.length === 0
		) {
			return null
		}
		return query(
			collection(firestore, 'prompts'),
			where(documentId(), 'in', userProfile.purchasedPrompts),
		)
	}, [firestore, userProfile?.purchasedPrompts])

	const favoritePromptsQuery = useMemoFirebase(() => {
		if (
			!firestore ||
			!userProfile?.favoritePrompts ||
			userProfile.favoritePrompts.length === 0
		) {
			return null
		}
		return query(
			collection(firestore, 'prompts'),
			where(documentId(), 'in', userProfile.favoritePrompts),
		)
	}, [firestore, userProfile?.favoritePrompts])

	const myPromptsQuery = useMemoFirebase(
		() =>
			user && firestore
				? query(
						collection(firestore, 'prompts'),
						where('authorId', '==', user.uid),
					)
				: null,
		[firestore, user],
	)

	const { data: purchasedPrompts } = useCollection<Prompt>(
		purchasedPromptsQuery,
	)
	const { data: favoritePrompts } = useCollection<Prompt>(favoritePromptsQuery)
	const { data: myPrompts } = useCollection<Prompt>(myPromptsQuery)

	useEffect(() => {
		if (!isUserLoading && !user) {
			router.replace('/')
		}
	}, [user, isUserLoading, router])

	if (isUserLoading || !user || !userProfile) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8'>
					<ProfileSkeleton />
				</main>
				<Footer />
			</div>
		)
	}

	const stats = userProfile?.stats
	const isSeller = userProfile?.isSeller ?? false
	const followers = userProfile?.followers ?? 0
	const following = userProfile?.following ?? 0
	const views = userProfile?.views ?? 0

	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow'>
				{showFeaturedImage && userProfile?.coverImageURL && (
					<div className='relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-muted'>
						<Image
							src={userProfile.coverImageURL}
							alt='Profile cover'
							fill
							className='object-cover'
							unoptimized
							priority
						/>
					</div>
				)}

				<div className='container mx-auto px-4 py-8 sm:px-6 lg:px-8'>
					<div className='flex flex-col lg:flex-row gap-8'>
						<AccountSidebar credits={credits} />
						<div className='flex-1 min-w-0'>
							<div className='flex flex-col sm:flex-row sm:items-end gap-6'>
								<Avatar className='h-24 w-24 sm:h-32 sm:w-32 border-4 border-background bg-background shrink-0 shadow-lg -mt-16 sm:-mt-20'>
									<AvatarImage
										src={userProfile?.photoURL ?? user.photoURL ?? ''}
										alt={user.displayName ?? 'User'}
									/>
									<AvatarFallback className='text-4xl'>
										{(
											userProfile?.displayName ??
											user.displayName ??
											'U'
										).charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div className='flex-1 py-4'>
									<div className='flex items-center gap-2 flex-wrap'>
										<h2 className='text-2xl font-bold'>
											{userProfile?.displayName ?? user.displayName ?? 'User'}
										</h2>
										{userProfile?.role === 'admin' && (
											<Badge variant='secondary'>Admin</Badge>
										)}
										{isSeller && <Badge variant='outline'>Seller</Badge>}
									</div>
									<p className='text-muted-foreground mt-1'>
										@{userProfile?.username ?? '...'}
									</p>
								</div>
								<div className='pb-4 flex flex-wrap gap-2'>
									<Button asChild variant='outline'>
										<Link href='/account'>
											<Edit2 className='mr-2 h-4 w-4' />
											Edit Profile
										</Link>
									</Button>
									<Button asChild>
										<Link href='/account/plans'>
											<CreditCard className='mr-2 h-4 w-4' />
											Billing
										</Link>
									</Button>
								</div>
							</div>

							{userProfile?.description && (
								<p className='mt-4 text-muted-foreground max-w-2xl'>
									{userProfile.description}
								</p>
							)}

							<div className='flex items-center gap-6 mt-6 text-sm border-t pt-6'>
								<div className='flex items-center gap-1.5'>
									<Users className='h-4 w-4 text-muted-foreground' />
									<span className='font-medium'>{followers}</span>
									<span className='text-muted-foreground'>Followers</span>
								</div>
								<div className='flex items-center gap-1.5'>
									<UserPlus className='h-4 w-4 text-muted-foreground' />
									<span className='font-medium'>{following}</span>
									<span className='text-muted-foreground'>Following</span>
								</div>
								<div className='flex items-center gap-1.5'>
									<Eye className='h-4 w-4 text-muted-foreground' />
									<span className='font-medium'>{views}</span>
									<span className='text-muted-foreground'>Profile Views</span>
								</div>
							</div>

							<div className='mt-8'>
								{isSeller && stats && (
									<Card className='mb-8'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<TrendingUp className='h-5 w-5' />
												Seller Statistics
											</CardTitle>
											<CardDescription>
												Your marketplace performance
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
												<div className='rounded-lg border p-4'>
													<div className='flex items-center gap-2 text-muted-foreground'>
														<DollarSign className='h-4 w-4' />
														<span className='text-sm'>Total Sales</span>
													</div>
													<p className='text-2xl font-bold mt-1'>
														{stats.totalSales ?? 0}
													</p>
												</div>
												<div className='rounded-lg border p-4'>
													<div className='flex items-center gap-2 text-muted-foreground'>
														<TrendingUp className='h-4 w-4' />
														<span className='text-sm'>Monthly</span>
													</div>
													<p className='text-2xl font-bold mt-1'>
														{stats.monthlySales ?? 0}
													</p>
												</div>
												<div className='rounded-lg border p-4'>
													<div className='flex items-center gap-2 text-muted-foreground'>
														<Package className='h-4 w-4' />
														<span className='text-sm'>Weekly</span>
													</div>
													<p className='text-2xl font-bold mt-1'>
														{stats.weeklySales ?? 0}
													</p>
												</div>
												<div className='rounded-lg border p-4'>
													<div className='flex items-center gap-2 text-muted-foreground'>
														<Star className='h-4 w-4' />
														<span className='text-sm'>Reputation</span>
													</div>
													<p className='text-2xl font-bold mt-1'>
														{stats.reputation ?? 0}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								)}

								<Card>
									<Tabs defaultValue='purchased'>
										<CardHeader>
											<TabsList className='grid w-full max-w-md grid-cols-3'>
												<TabsTrigger
													value='purchased'
													className='flex items-center gap-2'
												>
													<Package className='h-4 w-4' />
													Purchased
												</TabsTrigger>
												<TabsTrigger
													value='favorites'
													className='flex items-center gap-2'
												>
													<Heart className='h-4 w-4' />
													Favorites
												</TabsTrigger>
												<TabsTrigger
													value='my-prompts'
													className='flex items-center gap-2'
												>
													<Star className='h-4 w-4' />
													My Prompts
												</TabsTrigger>
											</TabsList>
										</CardHeader>
										<CardContent>
											<TabsContent value='purchased' className='mt-0'>
												{!userProfile?.purchasedPrompts ||
												userProfile.purchasedPrompts.length === 0 ? (
													<EmptyTabContent
														icon={Package}
														title='No purchases yet'
														description='Prompts you buy will appear here.'
														actionLabel='Browse Prompts'
													/>
												) : !purchasedPrompts ||
												  purchasedPrompts.length === 0 ? (
													<div className='flex justify-center py-12'>
														<Skeleton className='h-24 w-full max-w-md' />
													</div>
												) : (
													<PromptGrid prompts={purchasedPrompts} />
												)}
											</TabsContent>
											<TabsContent value='favorites' className='mt-0'>
												{!userProfile?.favoritePrompts ||
												userProfile.favoritePrompts.length === 0 ? (
													<EmptyTabContent
														icon={Heart}
														title='No favorites yet'
														description='Save prompts you love to find them easily later.'
														actionLabel='Discover Prompts'
													/>
												) : !favoritePrompts || favoritePrompts.length === 0 ? (
													<div className='flex justify-center py-12'>
														<Skeleton className='h-24 w-full max-w-md' />
													</div>
												) : (
													<PromptGrid prompts={favoritePrompts} />
												)}
											</TabsContent>
											<TabsContent value='my-prompts' className='mt-0'>
												{!myPrompts || myPrompts.length === 0 ? (
													<EmptyTabContent
														icon={Star}
														title='No creations yet'
														description='Prompts you create will appear here.'
														actionLabel='Create a Prompt'
													/>
												) : (
													<PromptGrid prompts={myPrompts} />
												)}
											</TabsContent>
										</CardContent>
									</Tabs>
								</Card>
							</div>
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
