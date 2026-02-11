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
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import {
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
	const avatarInputRef = useRef<HTMLInputElement>(null)
	const coverInputRef = useRef<HTMLInputElement>(null)
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

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile } = useDoc<UserProfile>(userProfileRef)

	const credits = 10 // Placeholder

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
		setIsSaving(true)
		try {
			await updateUserProfile(firestore, user.uid, {
				displayName: displayName.trim() || user.displayName || 'User',
				username: username.trim(),
				headline: headline.trim(),
				aiTools: aiTools.trim(),
				xProfile: xProfile.trim(),
				instagramProfile: instagramProfile.trim(),
				facebookProfile: facebookProfile.trim(),
			})
		} catch (err) {
			console.error(err)
		} finally {
			setIsSaving(false)
		}
	}, [
		user,
		firestore,
		displayName,
		username,
		headline,
		aiTools,
		xProfile,
		instagramProfile,
		facebookProfile,
	])

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

	const handleRemoveAvatar = useCallback(async () => {
		if (!user?.uid || !firestore) return
		try {
			await updateUserProfile(firestore, user.uid, { photoURL: '' })
		} catch (err) {
			console.error(err)
		}
	}, [user, firestore])

	const handleCoverChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file || !user?.uid || !firestore) return
			setIsUploadingCover(true)
			try {
				const url = await uploadCoverImage(user.uid, file)
				await updateUserProfile(firestore, user.uid, { coverImageURL: url })
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
													unoptimized
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
												onClick={() => coverInputRef.current?.click()}
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
											onChange={e => setDisplayName(e.target.value)}
											placeholder='Enter your display name'
										/>
									</div>

									{/* Username */}
									<div className='space-y-2'>
										<Label htmlFor='username'>Username</Label>
										<Input
											id='username'
											value={username}
											onChange={e => setUsername(e.target.value)}
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
										onChange={e => setHeadline(e.target.value)}
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
										onChange={e => setAiTools(e.target.value)}
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
											onChange={e => setXProfile(e.target.value)}
											placeholder='https://x.com/yourhandle'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='instagramProfile'>Instagram Profile</Label>
										<Input
											id='instagramProfile'
											value={instagramProfile}
											onChange={e => setInstagramProfile(e.target.value)}
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
											onChange={e => setFacebookProfile(e.target.value)}
											placeholder='https://facebook.com/yourhandle'
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Settings Card */}
						<Card>
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
								<ThemeSwitcher />
							</CardContent>
						</Card>

						<div className='flex justify-end'>
							<Button onClick={handleSave} disabled={isSaving}>
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