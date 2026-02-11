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
import { Camera, ImageIcon, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import AccountSidebar from '@/components/account/account-sidebar'

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
				displayName: (displayName.trim() || user.displayName) ?? 'User',
				username: username.trim() || undefined,
				headline: headline.trim() || undefined,
				aiTools: aiTools.trim() || undefined,
				xProfile: xProfile.trim() || undefined,
				instagramProfile: instagramProfile.trim() || undefined,
				facebookProfile: facebookProfile.trim() || undefined,
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
					<div className='flex-1 min-w-0'>
						{/* User identification */}
						<div className='flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8'>
							<Avatar className='h-20 w-20 border-4 border-background shadow-lg'>
								<AvatarImage
									src={userProfile?.photoURL ?? user.photoURL ?? ''}
									alt={user.displayName ?? 'User'}
								/>
								<AvatarFallback className='text-2xl'>
									{(userProfile?.displayName ?? user.displayName ?? 'U').charAt(
										0,
									)}
								</AvatarFallback>
							</Avatar>
							<div>
								<h1 className='font-headline text-2xl md:text-3xl font-bold'>
									{user.email}
								</h1>
								<p className='text-muted-foreground mt-1'>
									Manage your Promptly account
								</p>
							</div>
						</div>

						{/* Profile Information Card */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<ImageIcon className='h-5 w-5' />
									Profile Information
								</CardTitle>
								<CardDescription>
									Update your profile picture and account details
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-6'>
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
										JPG, PNG, WebP or GIF. Max 5MB. Recommended: 170x170px or
										larger.
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
									<p className='text-xs text-muted-foreground mb-2'>
										A banner image for your profile.{' '}
										<Link
											href='/profile'
											className='underline hover:text-primary'
										>
											Go to your Profile page
										</Link>
										, find a prompt you want to feature, and set it as
										featured.
									</p>
									{userProfile?.coverImageURL ? (
										<div className='relative w-full h-40 rounded-lg overflow-hidden bg-muted'>
											<Image
												src={userProfile.coverImageURL}
												alt='Featured'
												fill
												className='object-cover'
												unoptimized
											/>
											<div className='absolute bottom-2 right-2 flex gap-2'>
												<Button
													variant='secondary'
													size='sm'
													onClick={() => coverInputRef.current?.click()}
													disabled={isUploadingCover}
												>
													<Camera className='mr-2 h-4 w-4' />
													{isUploadingCover ? 'Uploading...' : 'Change'}
												</Button>
												<Button
													variant='destructive'
													size='sm'
													onClick={handleRemoveCover}
												>
													<Trash2 className='mr-2 h-4 w-4' />
													Remove
												</Button>
											</div>
											<input
												ref={coverInputRef}
												type='file'
												accept='image/*'
												className='hidden'
												onChange={handleCoverChange}
											/>
										</div>
									) : (
										<div className='flex items-center gap-4'>
											<div
												className='h-24 w-32 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted transition-colors'
												onClick={() => coverInputRef.current?.click()}
												role='button'
												tabIndex={0}
												onKeyDown={e =>
													e.key === 'Enter' &&
													coverInputRef.current?.click()
												}
											>
												{isUploadingCover ? (
													<span className='text-sm text-muted-foreground'>
														Uploading...
													</span>
												) : (
													<Camera className='h-8 w-8 text-muted-foreground' />
												)}
											</div>
											<input
												ref={coverInputRef}
												type='file'
												accept='image/*'
												className='hidden'
												onChange={handleCoverChange}
											/>
										</div>
									)}
								</div>

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
										This will be used for your public profile URL.
									</p>
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
										A big headline to summarize what you like creating and what
										you do best with AI.
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
										placeholder='AUTOMATIC1111, CodeFormer, Midjourney'
									/>
									<p className='text-xs text-muted-foreground'>
										Separate with commas. Only the first 3 will be used.
									</p>
								</div>

								{/* Social links */}
								<div className='space-y-4'>
									<Label>Social Profiles</Label>
									<div className='space-y-2'>
										<Label
											htmlFor='xProfile'
											className='text-muted-foreground text-sm'
										>
											X Profile
										</Label>
										<Input
											id='xProfile'
											value={xProfile}
											onChange={e => setXProfile(e.target.value)}
											placeholder='https://x.com/yourhandle'
										/>
									</div>
									<div className='space-y-2'>
										<Label
											htmlFor='instagramProfile'
											className='text-muted-foreground text-sm'
										>
											Instagram Profile
										</Label>
										<Input
											id='instagramProfile'
											value={instagramProfile}
											onChange={e => setInstagramProfile(e.target.value)}
											placeholder='https://instagram.com/yourhandle'
										/>
									</div>
									<div className='space-y-2'>
										<Label
											htmlFor='facebookProfile'
											className='text-muted-foreground text-sm'
										>
											Facebook Profile
										</Label>
										<Input
											id='facebookProfile'
											value={facebookProfile}
											onChange={e => setFacebookProfile(e.target.value)}
											placeholder='https://facebook.com/yourhandle'
										/>
									</div>
								</div>

								{/* Save */}
								<Button onClick={handleSave} disabled={isSaving}>
									{isSaving ? 'Saving...' : 'Save Changes'}
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
