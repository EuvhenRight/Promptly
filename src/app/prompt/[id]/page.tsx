'use client'

import { AddCommentForm } from '@/components/prompt/add-comment-form'
import { CommentList } from '@/components/prompt/comment-list'
import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	useCollection,
	useDoc,
	useFirestore,
	useMemoFirebase,
	useUser,
} from '@/firebase'
import { addPromptToCart } from '@/firebase/cart'
import {
	addPromptCommentAndRating,
	deletePromptComment,
	incrementPromptView,
	purchasePromptWithCredits,
	updatePromptComment,
} from '@/firebase/prompts'
import { followUser, toggleFavoritePrompt, unfollowUser } from '@/firebase/users'
import { useCategories } from '@/hooks/use-categories'
import { useToast } from '@/hooks/use-toast'
import type {
	Cart,
	Prompt,
	PromptComment,
	PromptPrivateContent,
	UserProfile,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import {
	collection,
	doc,
	getDoc,
	orderBy,
	query,
	type Firestore,
	Timestamp,
} from 'firebase/firestore'
import {
	Copy,
	Crown,
	Edit,
	Eye,
	Heart,
	Loader2,
	MoreHorizontal,
	PlusCircle,
	ShoppingCart,
	Star,
	Trash2,
	Coins,
	Download,
	Expand,
	Share2,
	X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Card } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { Separator } from '@/components/ui/separator'
import { useTags } from '@/hooks/use-tags'
import { useModels } from '@/hooks/use-models'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogClose,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const WITHDRAWAL_CONSENT_KEY = 'promptly_withdrawal_consent'

function getWithdrawalConsent(promptId: string): boolean {
	if (typeof window === 'undefined') return false
	try {
		const stored = localStorage.getItem(WITHDRAWAL_CONSENT_KEY)
		if (!stored) return false
		const parsed = JSON.parse(stored) as Record<string, boolean>
		return !!parsed[promptId]
	} catch {
		return false
	}
}

function setWithdrawalConsent(promptId: string): void {
	if (typeof window === 'undefined') return
	try {
		const stored = localStorage.getItem(WITHDRAWAL_CONSENT_KEY)
		const parsed: Record<string, boolean> = stored ? JSON.parse(stored) : {}
		parsed[promptId] = true
		localStorage.setItem(WITHDRAWAL_CONSENT_KEY, JSON.stringify(parsed))
	} catch {
		// ignore
	}
}

const PromptDetailSkeleton = () => (
	<div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12'>
		<div className='space-y-4'>
			<Skeleton className='w-full aspect-[3/4]' />
		</div>
		<div className='space-y-6'>
			<div className='space-y-3'>
				<Skeleton className='h-10 w-3/4' />
				<div className='flex items-center gap-4'>
					<Skeleton className='h-12 w-12 rounded-full' />
					<Skeleton className='h-6 w-1/4' />
				</div>
			</div>
			<Skeleton className='h-6 w-1/2' />
			<div className='flex flex-wrap gap-2'>
				<Skeleton className='h-6 w-20 rounded-full' />
				<Skeleton className='h-6 w-24 rounded-full' />
				<Skeleton className='h-6 w-16 rounded-full' />
			</div>
			<Skeleton className='h-20 w-full' />
			<Skeleton className='h-56 w-full' />
		</div>
	</div>
)

const formatStat = (num: number): string => {
	if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`
	if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
	return num.toString()
}

export default function PromptDetailPage() {
	const params = useParams<{ id: string }>()
	const { user } = useUser()
	const firestore = useFirestore()
	const { toast } = useToast()
	const viewIncremented = useRef(false)

	// --- Data Fetching ---
	const promptRef = useMemoFirebase(
		() =>
			firestore && params.id ? doc(firestore, 'prompts', params.id) : null,
		[firestore, params.id],
	)
	const { data: prompt, isLoading: isPromptLoading } = useDoc<Prompt>(promptRef)

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile } = useDoc<UserProfile>(userProfileRef)

	const cartRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid, 'carts', 'active') : null),
		[firestore, user],
	)
	const { data: cart } = useDoc<Cart>(cartRef)

	const isInCart = useMemo(
		() => cart?.promptIds?.includes(params.id as string) ?? false,
		[cart, params.id],
	)

	const commentsQuery = useMemoFirebase(
		() =>
			firestore && params.id
				? query(
						collection(firestore, 'prompts', params.id, 'comments'),
						orderBy('timestamp', 'desc'),
					)
				: null,
		[firestore, params.id],
	)
	const { data: comments, isLoading: areCommentsLoading } =
		useCollection<PromptComment>(commentsQuery)

	// --- State Management ---
	const [privateContent, setPrivateContent] = useState<string | null>(null)
	const [isLoadingPrivateContent, setIsLoadingPrivateContent] = useState(false)
	const [isEditingComment, setIsEditingComment] = useState(false)
	const [isSubmittingComment, setIsSubmittingComment] = useState(false)
	const [isDeletingComment, setIsDeletingComment] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false)
	const [isPurchasing, setIsPurchasing] = useState(false)
	const [isFollowLoading, setIsFollowLoading] = useState(false)
	const [withdrawalConsentCheckbox, setWithdrawalConsentCheckbox] = useState(false)
	const [withdrawalConsentGiven, setWithdrawalConsentGiven] = useState(false)

	// --- Memoized Derived State ---
	const amIFollowingRef = useMemoFirebase(() => {
    if (!firestore || !prompt?.authorId || !user?.uid || user.uid === prompt.authorId) return null;
    return doc(firestore, 'users', prompt.authorId, 'followers', user.uid);
	}, [firestore, prompt?.authorId, user?.uid]);

	const { data: amIFollowingDoc } = useDoc(amIFollowingRef);
	const isFollowing = !!amIFollowingDoc;

	const isFavorite = useMemo(
		() => userProfile?.favoritePrompts?.includes(params.id as string) ?? false,
		[userProfile, params.id],
	)

	const userComment = useMemo(
		() => comments?.find(comment => comment.userId === user?.uid),
		[comments, user],
	)

	const hasUserComment = !!userComment

	const otherComments = useMemo(
		() => comments?.filter(comment => comment.userId !== user?.uid) ?? [],
		[comments, user],
	)

	const isPurchased =
		userProfile?.purchasedPrompts?.includes(params.id as string) ?? false
	const isFree = prompt?.price === 0
	const isAdmin = userProfile?.role === 'admin'
	const isAuthor = user?.uid === prompt?.authorId
	const canViewContent = prompt && (isPurchased || isFree || isAdmin || isAuthor)
	const canComment = canViewContent && user

	const needsWithdrawalConsent =
		canViewContent && isPurchased && !isFree && !isAdmin
	const hasWithdrawalConsent =
		withdrawalConsentGiven ||
		(typeof window !== 'undefined' &&
			params.id &&
			getWithdrawalConsent(params.id as string))
	const canFetchPrivateContent =
		canViewContent && (!needsWithdrawalConsent || hasWithdrawalConsent)

	// --- Effects ---
	useEffect(() => {
		if (params.id && firestore && !viewIncremented.current) {
			incrementPromptView(firestore, params.id as string)
			viewIncremented.current = true
		}
	}, [params.id, firestore])

	useEffect(() => {
		if (canFetchPrivateContent && firestore && params.id && !privateContent) {
			setIsLoadingPrivateContent(true)
			const fetchPrivateContent = async (db: Firestore, promptId: string) => {
				const contentRef = doc(db, 'prompts', promptId, 'private', 'content')
				try {
					const contentSnap = await getDoc(contentRef)
					setPrivateContent(
						contentSnap.exists()
							? (contentSnap.data() as PromptPrivateContent).text
							: 'Content not found.',
					)
				} catch (e) {
					setPrivateContent('Could not load content due to an error.')
				} finally {
					setIsLoadingPrivateContent(false)
				}
			}
			fetchPrivateContent(firestore, params.id as string)
		}
	}, [canFetchPrivateContent, firestore, params.id, privateContent])

	// --- Handlers ---
	const handleAddToCart = () => {
		if (!user || !firestore || !prompt) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description: 'Please sign in to add items to your cart.',
			})
			return
		}
		addPromptToCart(firestore, user.uid, prompt.id)
		toast({
			title: 'Success!',
			description: `"${prompt.title}" has been added to your cart.`,
		})
	}

	const handleBuyNow = async () => {
		if (!user || !prompt) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description: 'Please sign in to purchase.',
			})
			return
		}
		if (!withdrawalConsentCheckbox) return
		setIsPurchasing(true)
		try {
			await purchasePromptWithCredits(user.uid, prompt.id)
			setWithdrawalConsent(prompt.id)
			setWithdrawalConsentGiven(true)
			toast({
				title: 'Purchase Successful!',
				description: `You have unlocked "${prompt.title}".`,
			})
			setShowPurchaseConfirm(false)
			setWithdrawalConsentCheckbox(false)
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Purchase Failed',
				description: error.message,
			})
		} finally {
			setIsPurchasing(false)
		}
	}

	const handleFollowToggle = async () => {
		if (!user || !firestore || !prompt) {
			toast({
				variant: 'destructive',
				title: 'Please sign in',
				description: 'You need to be logged in to follow users.',
			});
			return;
		}
		setIsFollowLoading(true);
		try {
			if (isFollowing) {
				await unfollowUser(firestore, user.uid, prompt.authorId);
				toast({ title: `You unfollowed ${prompt.authorDisplayName}` });
			} else {
				await followUser(firestore, user.uid, prompt.authorId);
				toast({ title: `You are now following ${prompt.authorDisplayName}` });
			}
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description: error.message || 'Could not update follow status.',
			});
		} finally {
			setIsFollowLoading(false);
		}
	};

	const handleToggleFavorite = () => {
		if (!user || !firestore || !prompt) {
			toast({
				variant: 'destructive',
				title: 'Please sign in',
				description: 'You need to be signed in to favorite prompts.',
			})
			return
		}
		toggleFavoritePrompt(firestore, user.uid, prompt.id, isFavorite)
		toast({
			title: isFavorite ? 'Removed from favorites' : 'Added to favorites',
		})
	}

	const handleCopy = () => {
		if (!privateContent) return
		navigator.clipboard.writeText(privateContent).then(() => {
			toast({ title: 'Copied to clipboard!' })
		})
	}

	const handleAddComment = async (data: {
		rating: number
		text: string
	}) => {
		if (!user || !firestore) return
		setIsSubmittingComment(true)
		try {
			await addPromptCommentAndRating({
				firestore,
				promptId: params.id as string,
				userId: user.uid,
				...data,
			})
			toast({
				title: 'Review submitted!',
				description: 'Thank you for your feedback.',
			})
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error submitting review',
				description: error.message,
			})
		} finally {
			setIsSubmittingComment(false)
		}
	}

	const handleUpdateComment = async (data: {
		rating: number
		text: string
	}) => {
		if (!user || !firestore) return
		setIsSubmittingComment(true)
		try {
			await updatePromptComment({
				firestore,
				promptId: params.id as string,
				userId: user.uid,
				...data,
			})
			toast({ title: 'Review updated!' })
			setIsEditingComment(false)
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error updating review',
				description: error.message,
			})
		} finally {
			setIsSubmittingComment(false)
		}
	}

	const handleDeleteComment = async () => {
		if (!user || !firestore) return
		setIsDeletingComment(true)
		try {
			await deletePromptComment({
				firestore,
				promptId: params.id as string,
				userId: user.uid,
			})
			toast({ title: 'Review deleted' })
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error deleting review',
				description: error.message,
			})
		} finally {
			setIsDeletingComment(false)
			setShowDeleteConfirm(false)
		}
	}

	const handleShare = () => {
		navigator.clipboard.writeText(window.location.href)
		toast({ title: 'Link copied to clipboard!' })
	}

	const { getNames } = useCategories()
	const { getNames: getTagNames } = useTags()
	const { getNames: getModelNames } = useModels()
	const isLoading = isPromptLoading

	// --- Render Methods ---
	const renderUserReviewSection = () => {
		if (!canComment) return null

		if (userComment) {
			if (isEditingComment) {
				return (
					<AddCommentForm
						key={`edit-${userComment.userId}`}
						promptId={params.id as string}
						initialData={userComment}
						isSubmitting={isSubmittingComment}
						onSubmit={handleUpdateComment}
						onCancel={() => setIsEditingComment(false)}
						submitButtonText='Update Review'
					/>
				)
			}
			return (
				<Card className='p-4 bg-muted/50'>
					<h3 className='font-semibold mb-2'>Your Review</h3>
					<div className='flex gap-4'>
						<Avatar>
							<AvatarImage
								src={userComment.authorPhotoURL}
								alt={userComment.authorDisplayName}
							/>
							<AvatarFallback>
								{userComment.authorDisplayName?.charAt(0) ?? 'U'}
							</AvatarFallback>
						</Avatar>
						<div className='flex-1'>
							<div className='flex items-start justify-between'>
								<div>
									<div className='flex items-center gap-2'>
										<span className='font-semibold'>
											{userComment.authorDisplayName ?? 'Anonymous'}
										</span>
										{userComment.authorPlanId === 'pro' && (
											<Badge className='bg-primary text-primary-foreground text-xs px-1.5 py-0'>
												<Crown className='mr-1 h-3 w-3' /> PRO
											</Badge>
										)}
										{userComment.authorPlanId === 'starter' && (
											<Badge variant='secondary' className='text-xs px-1.5 py-0'>
												<Star className='mr-1 h-3 w-3' /> Starter
											</Badge>
										)}
										<span className='text-xs text-muted-foreground'>
											{userComment.timestamp instanceof Timestamp
												? formatDistanceToNow(userComment.timestamp.toDate(), {
														addSuffix: true,
													})
												: ''}
										</span>
									</div>
									<div className='flex items-center gap-1 my-1'>
										{[1, 2, 3, 4, 5].map(star => (
											<Star
												key={star}
												className={`h-4 w-4 ${
													userComment.rating >= star
														? 'text-yellow-500 fill-yellow-400'
														: 'text-muted-foreground'
												}`}
											/>
										))}
									</div>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant='ghost'
											size='icon'
											className='h-8 w-8 flex-shrink-0'
										>
											<MoreHorizontal className='h-4 w-4' />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end'>
										<DropdownMenuItem onClick={() => setIsEditingComment(true)}>
											<Edit className='mr-2 h-4 w-4' />
											<span>Edit</span>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => setShowDeleteConfirm(true)}
											className='text-destructive focus:text-destructive'
										>
											<Trash2 className='mr-2 h-4 w-4' />
											<span>Delete</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<p className='text-sm text-foreground/80 mt-1'>
								{userComment.text}
							</p>
						</div>
					</div>
				</Card>
			)
		}

		return (
			<AddCommentForm
				key='add'
				promptId={params.id as string}
				isSubmitting={isSubmittingComment}
				onSubmit={handleAddComment}
				submitButtonText='Submit Review'
			/>
		)
	}

	const renderContent = () => {
		if (isLoading) {
			return <PromptDetailSkeleton />
		}

		if (!prompt) {
			return <p>Prompt not found.</p>
		}

		const authorUsername = prompt.authorUsername
		const authorDisplayName = prompt.authorDisplayName ?? 'Anonymous'
		const authorPhotoURL = prompt.authorPhotoURL ?? ''
		const authorInitial = authorDisplayName.charAt(0)

		const imageIdentifier = prompt.images?.[0]
		let promptImage: string | undefined
		let imageWidth: number = 720
		let imageHeight: number = 1280

		if (imageIdentifier) {
			if (imageIdentifier.startsWith('http')) {
				promptImage = imageIdentifier
			} else {
				const imageData = PlaceHolderImages.find(p => p.id === imageIdentifier)
				if (imageData) {
					promptImage = imageData.imageUrl
					imageWidth = imageData.width
					imageHeight = imageData.height
				}
			}
		}

		const categoryId = prompt.categoryId ?? prompt.categories?.[0]
		const categoryNames = getNames(categoryId)
		const tagNames = getTagNames(prompt.tags)
		const modelName = getModelNames(prompt.modelId)[0]

		const creditPrice = Math.round(prompt.price * 100)

		return (
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12'>
				<div className='space-y-4'>
					<div className='group relative w-full overflow-hidden rounded-lg border bg-muted'>
						{promptImage && (
							<Image
								src={promptImage}
								alt={prompt.title}
								width={imageWidth}
								height={imageHeight}
								sizes='(max-width: 1023px) 90vw, 50vw'
								className='w-full h-auto object-contain'
								priority
								unoptimized={promptImage.includes('storage.googleapis.com') || promptImage.includes('firebasestorage.googleapis.com')}
							/>
						)}
						{promptImage && (
							<div className='absolute right-4 top-4 z-10 flex flex-col items-center gap-2'>
								<a
									href={promptImage}
									download
									target='_blank'
									rel='noopener noreferrer'
								>
									<Button
										variant='secondary'
										size='icon'
										className='h-10 w-10 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70'
									>
										<Download className='h-5 w-5' />
										<span className='sr-only'>Download image</span>
									</Button>
								</a>
								<Dialog>
									<DialogTrigger asChild>
										<Button
											variant='secondary'
											size='icon'
											className='h-10 w-10 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70'
										>
											<Expand className='h-5 w-5' />
											<span className='sr-only'>View fullscreen</span>
										</Button>
									</DialogTrigger>
									<DialogContent className='max-w-7xl w-full p-0 bg-transparent border-none shadow-none' hideCloseButton>
										<DialogHeader>
											<DialogTitle className='sr-only'>
												Fullscreen image for: {prompt.title}
											</DialogTitle>
											<DialogDescription className='sr-only'>
												A larger, fullscreen view of the example image for this
												prompt.
											</DialogDescription>
										</DialogHeader>
										<Image
											src={promptImage}
											alt={prompt.title}
											width={1920}
											height={1080}
											className='w-full h-auto object-contain max-h-[90vh] rounded-lg'
											unoptimized={promptImage.includes('storage.googleapis.com') || promptImage.includes('firebasestorage.googleapis.com')}
										/>
										<DialogClose className='absolute right-4 top-4 rounded-full p-2 bg-black/50 text-white opacity-80 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary data-[state=open]:text-muted-foreground'>
											<X className='h-8 w-8' />
											<span className='sr-only'>Close</span>
										</DialogClose>
									</DialogContent>
								</Dialog>
								<Button
									variant='secondary'
									size='icon'
									onClick={handleShare}
									className='h-10 w-10 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70'
								>
									<Share2 className='h-5 w-5' />
									<span className='sr-only'>Share prompt</span>
								</Button>
							</div>
						)}
					</div>
				</div>

				<div className='space-y-6'>
					<h1 className='font-headline text-3xl md:text-4xl font-bold'>
						{prompt.title}
					</h1>

					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-4'>
							<Avatar>
								<AvatarImage src={authorPhotoURL} alt={authorDisplayName} />
								<AvatarFallback>{authorInitial}</AvatarFallback>
							</Avatar>
							<div>
								<div className='flex items-center gap-2'>
									<p className='font-semibold'>{authorDisplayName}</p>
									{prompt.authorPlanId === 'pro' && (
										<Badge className='bg-primary text-primary-foreground'>
											<Crown className='mr-1 h-3 w-3' /> PRO
										</Badge>
									)}
									{prompt.authorPlanId === 'starter' && (
										<Badge variant='secondary'>
											<Star className='mr-1 h-3 w-3' /> Starter
										</Badge>
									)}
								</div>
								{authorUsername ? (
									<Link
										href={`/user/${authorUsername}`}
										className='text-sm text-muted-foreground hover:underline'
									>
										@{authorUsername}
									</Link>
								) : (
									<p className='text-sm text-muted-foreground'>No username</p>
								)}
							</div>
						</div>
						{user && user.uid !== prompt.authorId && (
							<Button variant='outline' onClick={handleFollowToggle} disabled={isFollowLoading}>
								{isFollowLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
								{isFollowing ? 'Unfollow' : 'Follow'}
        					</Button>
						)}
					</div>

					<div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
						<div className='flex items-center gap-1'>
							<Star className='h-5 w-5 fill-yellow-400 text-yellow-500' />
							<span className='font-bold text-foreground'>
								{prompt.rating.average.toFixed(1)}
							</span>
							<span>({prompt.rating.count} ratings)</span>
						</div>
						<div className='flex items-center gap-1'>
							<Eye className='h-5 w-5' />
							<span className='font-bold text-foreground'>
								{formatStat(prompt.stats?.views ?? 0)}
							</span>
							<span>views</span>
						</div>
						<button
							onClick={handleToggleFavorite}
							disabled={!user}
							className='flex items-center gap-1.5 disabled:cursor-not-allowed group text-muted-foreground hover:text-primary transition-colors'
							aria-label='Toggle Favorite'
						>
							<Heart
								className={cn(
									'h-5 w-5 transition-colors',
									isFavorite
										? 'fill-red-500 text-red-500'
										: 'text-muted-foreground group-hover:text-red-500/80',
								)}
							/>
							<span className='font-bold text-foreground'>
								{formatStat(prompt.stats?.likes ?? 0)}
							</span>
							<span className='hidden sm:inline'>
								{isFavorite ? 'In Favorites' : 'Add to Favorites'}
							</span>
						</button>
					</div>

					<Separator />

					<div>
						<div className='grid grid-cols-2 gap-y-4 gap-x-2 text-sm'>
							{categoryId && (
								<div>
									<p className='text-muted-foreground'>Category</p>
									<p className='font-medium'>{categoryNames.join(', ')}</p>
								</div>
							)}
							{modelName && (
								<div>
									<p className='text-muted-foreground'>Model</p>
									<p className='font-medium'>{modelName}</p>
								</div>
							)}
						</div>
						{tagNames.length > 0 && (
							<div className='mt-4'>
								<p className='text-sm text-muted-foreground'>Tags</p>
								<div className='flex flex-wrap gap-2 mt-2'>
									{tagNames.map(tag => (
										<Badge key={tag} variant='outline'>
											{tag}
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>

					<p className='text-muted-foreground'>{prompt.description}</p>

					<Separator />

					<div className='rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4'>
						{!canViewContent ? (
							<>
								<div className='flex flex-wrap items-center justify-between gap-4'>
									<div className='flex items-center gap-2 text-2xl font-bold'>
										<Coins className='h-6 w-6 text-amber-500' />
										<span>{creditPrice}</span>
									</div>
									<div className='flex flex-grow justify-end items-center gap-2 sm:flex-grow-0'>
										<Button
											size='lg'
											variant='outline'
											onClick={handleAddToCart}
											className='flex-1 sm:flex-initial'
											disabled={!user || isInCart}
										>
											<ShoppingCart className='mr-2 h-4 w-4' />
											{isInCart ? 'In cart' : 'Add to Cart'}
										</Button>
										<AlertDialog
											open={showPurchaseConfirm}
											onOpenChange={(open) => {
												setShowPurchaseConfirm(open)
												if (!open) setWithdrawalConsentCheckbox(false)
											}}
										>
											<AlertDialogTrigger asChild>
												<Button
													size='lg'
													className='bg-accent text-accent-foreground hover:bg-accent/90 flex-1 sm:flex-initial'
													disabled={!user}
												>
													Buy Now
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
													<AlertDialogDescription>
														Are you sure you want to purchase this prompt?
													</AlertDialogDescription>
												</AlertDialogHeader>
												<div className='space-y-2 text-sm'>
													<p>
														<span className='font-semibold'>Prompt:</span>{' '}
														{prompt.title}
													</p>
													<div className='flex justify-between'>
														<span>Your current balance:</span>
														<span>{userProfile?.credits ?? 0} credits</span>
													</div>
													<div className='flex justify-between'>
														<span>Prompt cost:</span>
														<span className='text-destructive'>
															- {creditPrice} credits
														</span>
													</div>
													<Separator />
													<div className='flex justify-between font-bold'>
														<span>Remaining balance:</span>
														<span>
															{(userProfile?.credits ?? 0) - creditPrice}{' '}
															credits
														</span>
													</div>
													{(userProfile?.credits ?? 0) < creditPrice && (
														<p className='text-destructive font-bold pt-2'>
															You do not have enough credits for this purchase.
														</p>
													)}
													<div className='flex items-start space-x-2 pt-2'>
														<Checkbox
															id='withdrawal-consent'
															checked={withdrawalConsentCheckbox}
															onCheckedChange={(checked) =>
																setWithdrawalConsentCheckbox(checked === true)
															}
														/>
														<Label
															htmlFor='withdrawal-consent'
															className='text-sm font-normal cursor-pointer leading-tight'
														>
															I agree to immediate access to this digital content
															and acknowledge that I will lose my 14-day right of
															withdrawal under EU consumer law.
														</Label>
													</div>
												</div>
												<AlertDialogFooter>
													<AlertDialogCancel disabled={isPurchasing}>
														Cancel
													</AlertDialogCancel>
													{(userProfile?.credits ?? 0) >= creditPrice ? (
														<AlertDialogAction
															onClick={handleBuyNow}
															disabled={isPurchasing || !withdrawalConsentCheckbox}
														>
															{isPurchasing && (
																<Loader2 className='mr-2 h-4 w-4 animate-spin' />
															)}
															Confirm Purchase
														</AlertDialogAction>
													) : (
														<AlertDialogAction asChild>
															<Link href='/account/plans#credits'>
																Buy Credits
															</Link>
														</AlertDialogAction>
													)}
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</div>
								<div className='p-8 bg-muted rounded-lg text-center relative'>
									<div className='absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg'>
										<div className='text-center font-bold text-lg'>
											Unlock to view prompt
										</div>
									</div>
									<p className='text-muted-foreground italic line-clamp-3'>
										"A hyper-realistic 4K image of a majestic lion with a
										flowing mane, set against a backdrop of a golden sunset on
										the African savanna. The lighting should be dramatic, with
										long shadows and a warm, orange glow. The lion's
										expression should be noble and powerful. Use a shallow
										depth of field to isolate the lion from the background.
										Shot on a Sony A7R IV with a 200mm f/2.8 lens."
									</p>
								</div>
							</>
						) : needsWithdrawalConsent && !hasWithdrawalConsent ? (
							<div className='rounded-lg border border-amber-500/50 bg-amber-500/10 p-6 space-y-4'>
								<h3 className='font-semibold text-foreground'>
									Before viewing your purchased content
								</h3>
								<p className='text-sm text-muted-foreground'>
									Under EU consumer law, you have a 14-day right to withdraw from
									complete purchases. By viewing this digital content now, you
									expressly agree to immediate access and acknowledge that you
									will lose your right of withdrawal for this purchase.
								</p>
								<Button
									onClick={() => {
										if (params.id) {
											setWithdrawalConsent(params.id as string)
											setWithdrawalConsentGiven(true)
										}
									}}
								>
									I agree, view content
								</Button>
							</div>
						) : (
							<>
								<div className='flex flex-wrap items-center justify-between gap-4'>
									<h2 className='text-2xl font-bold'>
										{prompt.price === 0 ? 'Free' : isAuthor ? 'Your Prompt' : 'Purchased'}
									</h2>
									<Button
										size='lg'
										onClick={handleCopy}
										disabled={isLoadingPrivateContent || !privateContent}
									>
										<Copy className='mr-2 h-4 w-4' />
										{isLoadingPrivateContent ? 'Loading...' : 'Copy Prompt'}
									</Button>
								</div>
								<div className='p-4 bg-muted rounded-lg relative min-h-[100px]'>
									{isLoadingPrivateContent ? (
										<div className='flex items-center justify-center h-full'>
											<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
										</div>
									) : (
										<p className='text-sm text-foreground/90 whitespace-pre-wrap font-mono'>
											{privateContent}
										</p>
									)}
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='flex min-h-screen flex-col'>
			<Header />
			<main className='flex-grow container mx-auto px-4 py-8'>
				{renderContent()}

				<div className='mt-12 pt-8 border-t'>
					<h2 className='font-headline text-2xl font-bold mb-6'>Reviews</h2>
					<div className='space-y-8'>
						{renderUserReviewSection()}
						{otherComments.length > 0 && (
							<CommentList
								comments={otherComments}
								isLoading={areCommentsLoading}
								hasUserComment={hasUserComment}
							/>
						)}
						{otherComments.length === 0 &&
							!hasUserComment &&
							!areCommentsLoading && (
								<p className='text-muted-foreground text-center py-4'>
									No reviews yet.
								</p>
							)}
					</div>
				</div>
			</main>
			<Footer />
			<AlertDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete your review?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. Your review will be permanently
							removed.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeletingComment}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteComment}
							disabled={isDeletingComment}
							className='bg-destructive hover:bg-destructive/90'
						>
							{isDeletingComment && (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							)}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}