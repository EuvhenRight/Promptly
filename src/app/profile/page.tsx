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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
	useCollection,
	useDoc,
	useFirestore,
	useMemoFirebase,
	useUser,
} from '@/firebase'
import { updateUserProfile, uploadAvatar } from '@/firebase/users'
import type { Prompt, UserProfile } from '@/lib/types'
import { collection, doc, documentId, query, where } from 'firebase/firestore'
import {
	Camera,
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
import { useCallback, useEffect, useRef, useState } from 'react'

function ProfileSkeleton() {
	return (
		<div className='space-y-8'>
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
	const avatarInputRef = useRef<HTMLInputElement>(null)
	const [isEditing, setIsEditing] = useState(false)
	const [displayName, setDisplayName] = useState('')
	const [description, setDescription] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

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
		if (userProfile?.displayName) {
			setDisplayName(userProfile.displayName)
		} else if (user?.displayName) {
			setDisplayName(user.displayName ?? '')
		}
		if (userProfile?.description !== undefined) {
			setDescription(userProfile.description ?? '')
		}
	}, [userProfile?.displayName, userProfile?.description, user?.displayName])

	useEffect(() => {
		if (!isUserLoading && !user) {
			router.replace('/')
		}
	}, [user, isUserLoading, router])

	const handleSaveProfile = useCallback(async () => {
		if (!user?.uid || !firestore) return
		setIsSaving(true)
		try {
			await updateUserProfile(firestore, user.uid, {
				displayName: (displayName.trim() || user.displayName) ?? 'User',
				description: description.trim() || undefined,
			})
			setIsEditing(false)
		} catch (err) {
			console.error(err)
		} finally {
			setIsSaving(false)
		}
	}, [user, firestore, displayName, description])

	const handleAvatarChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file || !user?.uid || !firestore) return
			setIsUploadingAvatar(true)
			try {
				const url = await uploadAvatar(user.uid, file)
				await updateUserProfile(firestore, user.uid, { photoURL: url })
			} catch (err) {
				console.error(err)
			} finally {
				setIsUploadingAvatar(false)
				e.target.value = ''
			}
		},
		[user, firestore],
	)

	if (isUserLoading || !user) {
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
			<main className='flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8'>
				<h1 className='font-headline text-3xl md:text-4xl font-bold mb-8'>
					Profile
				</h1>

				{/* Profile Header with Stats */}
				<div className='flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8'>
					<div className='relative group'>
						<Avatar className='h-24 w-24 border-4 border-background shadow-lg'>
							<AvatarImage
								src={(userProfile?.photoURL || user.photoURL) ?? ''}
								alt={user.displayName ?? 'User'}
							/>
							<AvatarFallback className='text-2xl'>
								{(userProfile?.displayName ?? user.displayName ?? 'U').charAt(
									0,
								)}
							</AvatarFallback>
						</Avatar>
						{isEditing && (
							<button
								type='button'
								onClick={() => avatarInputRef.current?.click()}
								disabled={isUploadingAvatar}
								className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50'
							>
								<Camera className='h-8 w-8 text-white' />
							</button>
						)}
						<input
							ref={avatarInputRef}
							type='file'
							accept='image/*'
							className='hidden'
							onChange={handleAvatarChange}
						/>
					</div>
					<div className='flex-1'>
						<div className='flex items-center gap-2 flex-wrap'>
							<h2 className='text-2xl font-semibold'>
								{userProfile?.displayName ?? user.displayName ?? 'User'}
							</h2>
							{userProfile?.role === 'admin' && (
								<Badge variant='secondary'>Admin</Badge>
							)}
							{isSeller && <Badge variant='outline'>Seller</Badge>}
						</div>
						<p className='text-muted-foreground mt-1'>{user.email}</p>
						{userProfile?.description && !isEditing && (
							<p className='mt-2 text-sm text-muted-foreground max-w-xl'>
								{userProfile.description}
							</p>
						)}

						{/* Stats Row: Followers, Following, Views */}
						<div className='flex items-center gap-6 mt-4 text-sm'>
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
								<span className='text-muted-foreground'>Views</span>
							</div>
						</div>

						<div className='flex flex-wrap gap-2 mt-4'>
							<Link href='/checkout'>
								<Button variant='outline' size='sm'>
									<CreditCard className='mr-2 h-4 w-4' />
									Billing
								</Button>
							</Link>
							<Button
								variant={isEditing ? 'default' : 'outline'}
								size='sm'
								onClick={() =>
									isEditing ? handleSaveProfile() : setIsEditing(true)
								}
								disabled={isSaving}
							>
								<Edit2 className='mr-2 h-4 w-4' />
								{isEditing ? (isSaving ? 'Saving...' : 'Save') : 'Edit Profile'}
							</Button>
							{isEditing && (
								<Button
									variant='ghost'
									size='sm'
									onClick={() => {
										setIsEditing(false)
										setDisplayName(
											userProfile?.displayName ?? user.displayName ?? '',
										)
										setDescription(userProfile?.description ?? '')
									}}
									disabled={isSaving}
								>
									Cancel
								</Button>
							)}
						</div>
					</div>
				</div>

				{/* Edit Profile Card */}
				{isEditing && (
					<Card className='mb-8'>
						<CardHeader>
							<CardTitle>Edit Profile</CardTitle>
							<CardDescription>
								Update your name, avatar, and bio
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='displayName'>Name</Label>
								<Input
									id='displayName'
									value={displayName}
									onChange={e => setDisplayName(e.target.value)}
									placeholder='Your name'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='avatar'>Avatar</Label>
								<div className='flex items-center gap-4'>
									<Avatar className='h-16 w-16'>
										<AvatarImage
											src={(userProfile?.photoURL || user.photoURL) ?? ''}
										/>
										<AvatarFallback>
											{displayName?.charAt(0) ?? 'U'}
										</AvatarFallback>
									</Avatar>
									<Button
										variant='outline'
										size='sm'
										onClick={() => avatarInputRef.current?.click()}
										disabled={isUploadingAvatar}
									>
										<Camera className='mr-2 h-4 w-4' />
										{isUploadingAvatar ? 'Uploading...' : 'Change photo'}
									</Button>
								</div>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='description'>Description</Label>
								<Textarea
									id='description'
									value={description}
									onChange={e => setDescription(e.target.value)}
									placeholder='Tell us about yourself...'
									rows={3}
								/>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Seller Stats (if applicable) */}
				{isSeller && stats && (
					<Card className='mb-8'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<TrendingUp className='h-5 w-5' />
								Seller Statistics
							</CardTitle>
							<CardDescription>Your marketplace performance</CardDescription>
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

				{/* Tabs: Purchased Prompts | My Favorites | My Models */}
				<Card>
					<Tabs defaultValue='purchased'>
						<CardHeader>
							<TabsList className='grid w-full max-w-md grid-cols-3'>
								<TabsTrigger
									value='purchased'
									className='flex items-center gap-2'
								>
									<Package className='h-4 w-4' />
									Purchased Prompts
								</TabsTrigger>
								<TabsTrigger
									value='favorites'
									className='flex items-center gap-2'
								>
									<Heart className='h-4 w-4' />
									My Favorites
								</TabsTrigger>
								<TabsTrigger value='models' className='flex items-center gap-2'>
									<Star className='h-4 w-4' />
									My Models
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
								) : !purchasedPrompts || purchasedPrompts.length === 0 ? (
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
							<TabsContent value='models' className='mt-0'>
								{!myPrompts || myPrompts.length === 0 ? (
									<EmptyTabContent
										icon={Star}
										title='No models yet'
										description='AI models you use or create will appear here.'
										actionLabel='Explore'
									/>
								) : (
									<PromptGrid prompts={myPrompts} />
								)}
							</TabsContent>
						</CardContent>
					</Tabs>
				</Card>
			</main>
			<Footer />
		</div>
	)
}
