'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Switch } from '@/components/ui/switch'
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import {
	checkUsernameExists,
	updateUserProfile,
	uploadAvatar,
	uploadCoverImage,
} from '@/firebase/users'
import type { UserProfile } from '@/lib/types'
import { doc } from 'firebase/firestore'
import {
	Camera,
	ImageIcon,
	Settings,
	Trash2,
	Link as LinkIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import AccountSidebar from '@/components/account/account-sidebar'
import { ThemeSwitcher } from '@/components/account/theme-switcher'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { ToastAction } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

function AccountPageSkeleton() {
	return (
		<div className='space-y-8'>
			<div className='flex flex-col sm:flex-row items-start sm:items-center gap-6'>
				<Skeleton className='h-24 w-24 rounded-full' />
				<div className='space-y-2'>
					<Skeleton className='h-8 w-48' />
					<Skeleton className='h-4 w-64' />
				</div>
			</div>
			<Card>
				<CardHeader>
					<Skeleton className='h-6 w-1/3' />
					<Skeleton className='h-4 w-2/3' />
				</CardHeader>
				<CardContent className='space-y-4'>
					<Skeleton className='h-32 w-full' />
					<Skeleton className='h-32 w-full' />
				</CardContent>
			</Card>
		</div>
	)
}

export default function AccountPage() {
	const { user, isUserLoading } = useUser()
	const firestore = useFirestore()
	const router = useRouter()
	const { toast } = useToast()

	const avatarInputRef = useRef<HTMLInputElement>(null)
	const coverInputRef = useRef<HTMLInputElement>(null)
	const appearanceCardRef = useRef<HTMLDivElement>(null)

	const [displayName, setDisplayName] = useState('')
	const [username, setUsername] = useState('')
	const [headline, setHeadline] = useState('')
	const [aiTools, setAiTools] = useState('')
	const [xProfile, setXProfile] = useState('')
	const [instagramProfile, setInstagramProfile] = useState('')
	const [facebookProfile, setFacebookProfile] = useState('')

	const [isSaving, setIsSaving] = useState(false)
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
	const [isUploadingCover, setIsUploadingCover] = useState(false)
	const [isDirty, setIsDirty] = useState(false)
	const [showFeaturedImage, setShowFeaturedImage] = useState<boolean | null>(
		null,
	)
	const [hideMyPrompts, setHideMyPrompts] = useState<boolean | null>(null)

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile } = useDoc<UserProfile>(userProfileRef)
	const isPro = userProfile?.planId === 'pro'
	const credits = userProfile?.credits ?? 0

	// Load and save preferences from/to localStorage
	useEffect(() => {
		if (!isPro) {
			setShowFeaturedImage(false)
			setHideMyPrompts(false)
			return
		}
		const storedPreference = localStorage.getItem('showFeaturedImage')
		setShowFeaturedImage(
			storedPreference !== null ? JSON.parse(storedPreference) : true,
		)
		const storedHideMyPrompts = localStorage.getItem('hideMyPrompts')
		setHideMyPrompts(
			storedHideMyPrompts !== null ? JSON.parse(storedHideMyPrompts) : false,
		)
	}, [isPro])

	useEffect(() => {
		if (!isPro) return
		if (showFeaturedImage !== null) {
			localStorage.setItem(
				'showFeaturedImage',
				JSON.stringify(showFeaturedImage),
			)
		}
		if (hideMyPrompts !== null) {
			localStorage.setItem('hideMyPrompts', JSON.stringify(hideMyPrompts))
		}
	}, [showFeaturedImage, hideMyPrompts, isPro])

	// Warn user about unsaved changes before leaving the page
	useEffect(() => {
		if (!isDirty) return

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault()
			e.returnValue = '' // Required for Chrome to show the prompt
		}

		window.addEventListener('beforeunload', handleBeforeUnload)

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [isDirty])

	useEffect(() => {
		setDisplayName(userProfile?.displayName ?? user?.displayName ?? '')
		setUsername(userProfile?.username ?? '')
		setHeadline(userProfile?.headline ?? '')
		setAiTools(userProfile?.aiTools ?? '')
		setXProfile(userProfile?.xProfile ?? '')
		setInstagramProfile(userProfile?.instagramProfile ?? '')
		setFacebookProfile(userProfile?.facebookProfile ?? '')
	}, [userProfile, user?.displayName])

	useEffect(() => {
		if (!isUserLoading && !user) {
			router.replace('/')
		}
	}, [user, isUserLoading, router])

	const handleSave = useCallback(async () => {
		if (!user?.uid || !firestore) return

		const newUsername = username.trim()

		// --- Validation ---
		if (newUsername.length > 0 && newUsername !== userProfile?.username) {
			if (newUsername.length < 3 || newUsername.length > 20) {
				toast({
					variant: 'destructive',
					title: 'Invalid Username',
					description: 'Username must be between 3 and 20 characters.',
				})
				return
			}
			if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
				toast({
					variant: 'destructive',
					title: 'Invalid Username',
					description: 'Can only contain letters, numbers, and underscores.',
				})
				return
			}
			const isTaken = await checkUsernameExists(firestore, newUsername, user.uid)
			if (isTaken) {
				toast({
					variant: 'destructive',
					title: 'Username Taken',
					description: 'This username is already in use.',
				})
				return
			}
		}

		setIsSaving(true)
		try {
			await updateUserProfile(firestore, user.uid, {
				displayName: displayName.trim() || user.displayName || 'User',
				username: newUsername,
				headline: headline.trim(),
				aiTools: aiTools.trim(),
				xProfile: xProfile.trim(),
				instagramProfile: instagramProfile.trim(),
				facebookProfile: facebookProfile.trim(),
			})
			setIsDirty(false) // Reset dirty state on successful save
			toast({
				title: 'Profile Saved',
				description: 'Your changes have been successfully saved.',
			})
		} catch (err) {
			console.error(err)
			toast({
				variant: 'destructive',
				title: 'Error Saving',
				description:
					err instanceof Error ? err.message : 'Could not save profile.',
			})
		} finally {
			setIsSaving(false)
		}
	}, [
		user,
		firestore,
		userProfile?.username,
		displayName,
		username,
		headline,
		aiTools,
		xProfile,
		instagramProfile,
		facebookProfile,
		toast,
	])

	const handleAvatarChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file || !user?.uid || !firestore) return
			setIsUploadingAvatar(true)
			try {
				const url = await uploadAvatar(user.uid, file)
				await updateUserProfile(firestore, user.uid, { photoURL: url })
				setIsDirty(true)
			} catch (err) {
				console.error(err)
			} finally {
				setIsUploadingAvatar(false)
				e.target.value = ''
			}
		},
		[user, firestore],
	)

	const handleRemoveAvatar = useCallback(async () => {
		if (!user?.uid || !firestore) return
		try {
			await updateUserProfile(firestore, user.uid, { photoURL: '' })
			setIsDirty(true)
		} catch (err) {
			console.error(err)
		}
	}, [user, firestore])

	const handleCoverButtonClick = () => {
		if (!isPro) {
			toast({
				title: 'PRO Feature',
				description: 'Upgrade to PRO to use a featured image on your profile.',
				action: (
					<ToastAction altText='Upgrade'>
						<Link href='/account/plans'>Upgrade</Link>
					</ToastAction>
				),
			})
			return
		}

		if (showFeaturedImage) {
			coverInputRef.current?.click()
		} else {
			appearanceCardRef.current?.scrollIntoView({ behavior: 'smooth' })
			toast({
				title: 'Enable Featured Image',
				description:
					"To change your featured image, first enable the 'Show Featured Image' option in the Appearance settings below.",
				variant: 'default',
			})
		}
	}

	const handleCoverChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file || !user?.uid || !firestore) return
			setIsUploadingCover(true)
			try {
				const url = await uploadCoverImage(user.uid, file)
				await updateUserProfile(firestore, user.uid, { coverImageURL: url })
				setIsDirty(true)
			} catch (err) {
				console.error(err)
			} finally {
				setIsUploadingCover(false)
				e.target.value = ''
			}
		},
		[user, firestore],
	)

	const handleRemoveCover = useCallback(async () => {
		if (!user?.uid || !firestore) return
		try {
			await updateUserProfile(firestore, user.uid, { coverImageURL: '' })
			setIsDirty(true)
		} catch (err) {
			console.error(err)
		}
	}, [user, firestore])

	if (isUserLoading || !user) {
		return (
			<div className='flex min-h-screen flex-col'>
				<Header />
				<main className='flex-grow container mx-auto px-4 py-8'>
					<div className='flex flex-col lg:flex-row gap-8'>
						<div className='w-full lg:w-56 shrink-0'>
							<Skeleton className='h-48 w-full' />
						</div>
						<div className='flex-1 min-w-0'>
							<AccountPageSkeleton />
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
							<h1 className='font-headline text-3xl font-bold'>Account</h1>
							<p className='mt-1 text-muted-foreground'>
								Manage your Promptly account settings.
							</p>
						</div>

						{/* Profile Information Card */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<ImageIcon className='h-5 w-5' />
									Profile Information
								</CardTitle>
								<CardDescription>
									Update your profile picture and account details. Changes will be
									reflected on your public profile.
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-6'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									{/* Profile Picture */}
									<div className='space-y-2'>
										<Label>Profile Picture</Label>
										<div className='flex items-center gap-4'>
											<Avatar className='h-20 w-20'>
												<AvatarImage
													src={userProfile?.photoURL ?? user.photoURL ?? ''}
												/>
												<AvatarFallback className='text-xl'>
													{displayName?.charAt(0) ?? 'U'}
												</AvatarFallback>
											</Avatar>
											<div className='flex flex-col gap-2'>
												<Button
													variant='outline'
													size='sm'
													onClick={() => avatarInputRef.current?.click()}
													disabled={isUploadingAvatar}
												>
													<Camera className='mr-2 h-4 w-4' />
													{isUploadingAvatar ? 'Uploading...' : 'Change Image'}
												</Button>
												<Button
													variant='ghost'
													size='sm'
													onClick={handleRemoveAvatar}
													className='text-muted-foreground hover:text-destructive'
												>
													<Trash2 className='mr-2 h-4 w-4' />
													Remove
												</Button>
											</div>
										</div>
										<p className='text-xs text-muted-foreground'>
											JPG, PNG, WebP or GIF. Max 5MB.
										</p>
										<input
											ref={avatarInputRef}
											type='file'
											accept='image/*'
											className='hidden'
											onChange={handleAvatarChange}
										/>
									</div>

									{/* Featured Image (Cover) */}
									<div className='space-y-2'>
										<Label>Featured Image</Label>
										<div className='relative w-full h-28 rounded-lg overflow-hidden bg-muted'>
											{userProfile?.coverImageURL ? (
												<Image
													src={userProfile.coverImageURL}
													alt='Featured'
													fill
													className='object-cover'
												/>
											) : (
												<div className='flex items-center justify-center h-full'>
													<ImageIcon className='h-8 w-8 text-muted-foreground' />
												</div>
											)}
										</div>
										<div className='flex gap-2'>
											<Button
												variant='outline'
												size='sm'
												onClick={handleCoverButtonClick}
												disabled={isUploadingCover}
											>
												<Camera className='mr-2 h-4 w-4' />
												{isUploadingCover ? 'Uploading...' : 'Change'}
											</Button>
											<Button
												variant='ghost'
												size='sm'
												onClick={handleRemoveCover}
												className='text-muted-foreground hover:text-destructive'
											>
												<Trash2 className='mr-2 h-4 w-4' />
												Remove
											</Button>
										</div>
										<p className='text-xs text-muted-foreground'>
											This is the banner for your public profile page.
										</p>
										<input
											ref={coverInputRef}
											type='file'
											accept='image/*'
											className='hidden'
											onChange={handleCoverChange}
										/>
									</div>
								</div>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									{/* Display Name */}
									<div className='space-y-2'>
										<Label htmlFor='displayName'>Display Name</Label>
										<Input
											id='displayName'
											value={displayName}
											onChange={e => {
												setDisplayName(e.target.value)
												setIsDirty(true)
											}}
											placeholder='Enter your display name'
										/>
									</div>

									{/* Username */}
									<div className='space-y-2'>
										<Label htmlFor='username'>Username</Label>
										<Input
											id='username'
											value={username}
											onChange={e => {
												setUsername(e.target.value)
												setIsDirty(true)
											}}
											placeholder='Enter your unique username'
										/>
										<p className='text-xs text-muted-foreground'>
											Your public URL will be /user/{username || '...'}
										</p>
									</div>
								</div>
								{/* Headline */}
								<div className='space-y-2'>
									<Label htmlFor='headline'>Headline</Label>
									<Input
										id='headline'
										value={headline}
										onChange={e => {
											setHeadline(e.target.value)
											setIsDirty(true)
										}}
										placeholder='e.g. AI Enthusiast & Prompt Creator'
									/>
									<p className='text-xs text-muted-foreground'>
										A brief summary of what you do.
									</p>
								</div>

								{/* AI Tools */}
								<div className='space-y-2'>
									<Label htmlFor='aiTools'>
										What AI tools do you like using?
									</Label>
									<Input
										id='aiTools'
										value={aiTools}
										onChange={e => {
											setAiTools(e.target.value)
											setIsDirty(true)
										}}
										placeholder='Midjourney, Stable Diffusion, etc.'
									/>
									<p className='text-xs text-muted-foreground'>
										Separate with commas.
									</p>
								</div>
							</CardContent>
						</Card>

						{/* Social Profiles Card */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<LinkIcon className='h-5 w-5' />
									Social Profiles
								</CardTitle>
								<CardDescription>
									Add links to your social media profiles.
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									<div className='space-y-2'>
										<Label htmlFor='xProfile'>X Profile</Label>
										<Input
											id='xProfile'
											value={xProfile}
											onChange={e => {
												setXProfile(e.target.value)
												setIsDirty(true)
											}}
											placeholder='https://x.com/yourhandle'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='instagramProfile'>Instagram Profile</Label>
										<Input
											id='instagramProfile'
											value={instagramProfile}
											onChange={e => {
												setInstagramProfile(e.target.value)
												setIsDirty(true)
											}}
											placeholder='https://instagram.com/yourhandle'
										/>
									</div>
								</div>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									<div className='space-y-2'>
										<Label htmlFor='facebookProfile'>Facebook Profile</Label>
										<Input
											id='facebookProfile'
											value={facebookProfile}
											onChange={e => {
												setFacebookProfile(e.target.value)
												setIsDirty(true)
											}}
											placeholder='https://facebook.com/yourhandle'
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Settings Card */}
						<Card ref={appearanceCardRef}>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Settings className='h-5 w-5' />
									Appearance
								</CardTitle>
								<CardDescription>
									Customize the look and feel of the application.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ThemeSwitcher isPro={isPro} />
								{showFeaturedImage !== null && (
									<div
										className={cn(
											'mt-4 flex items-center justify-between rounded-lg border p-4',
											!isPro && 'bg-muted/50',
										)}
									>
										<Label
											htmlFor={isPro ? 'featured-image-switch' : undefined}
											className={cn(
												'flex flex-col space-y-1',
												isPro && 'cursor-pointer',
											)}
										>
											<div className='flex items-center gap-2'>
												<span>Show Featured Image</span>
												<Badge
													variant='outline'
													className='border-primary text-primary font-bold'
												>
													PRO
												</Badge>
											</div>
											<span className='font-normal leading-snug text-muted-foreground'>
												{isPro
													? 'Toggle visibility of the featured image editor.'
													: 'Available for PRO users.'}
											</span>
										</Label>
										<Switch
											id='featured-image-switch'
											checked={isPro ? showFeaturedImage : false}
											onCheckedChange={setShowFeaturedImage}
											disabled={!isPro}
										/>
									</div>
								)}
								{hideMyPrompts !== null && (
									<div
										className={cn(
											'mt-4 flex items-center justify-between rounded-lg border p-4',
											!isPro && 'bg-muted/50',
										)}
									>
										<Label
											htmlFor={isPro ? 'hide-my-prompts-switch' : undefined}
											className={cn(
												'flex flex-col space-y-1',
												isPro && 'cursor-pointer',
											)}
										>
											<div className='flex items-center gap-2'>
												<span>Hide My Prompts in Feed</span>
												<Badge
													variant='outline'
													className='border-primary text-primary font-bold'
												>
													PRO
												</Badge>
											</div>
											<span className='font-normal leading-snug text-muted-foreground'>
												{isPro
													? 'Do not show your own creations in the main feed.'
													: 'Available for PRO users.'}
											</span>
										</Label>
										<Switch
											id='hide-my-prompts-switch'
											checked={isPro ? !!hideMyPrompts : false}
											onCheckedChange={setHideMyPrompts}
											disabled={!isPro}
										/>
									</div>
								)}
							</CardContent>
						</Card>

						<div className='flex justify-end'>
							<Button onClick={handleSave} disabled={isSaving || !isDirty}>
								{isSaving ? 'Saving...' : 'Save All Changes'}
							</Button>
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
