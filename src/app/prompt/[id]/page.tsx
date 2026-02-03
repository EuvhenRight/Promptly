'use client'

import Footer from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import { addPromptToCart } from '@/firebase/cart'
import { toggleFavoritePrompt } from '@/firebase/users'
import { useCategories } from '@/hooks/use-categories'
import { useToast } from '@/hooks/use-toast'
import type { Prompt, UserProfile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { doc } from 'firebase/firestore'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const PromptDetailSkeleton = () => (
	<div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12'>
		<div className='space-y-4'>
			<Skeleton className='aspect-[4/3] w-full rounded-lg' />
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

export default function PromptDetailPage() {
	const params = useParams<{ id: string }>()
	const { user } = useUser()
	const firestore = useFirestore()
	const { toast } = useToast()

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

	const { getNames } = useCategories()

	const isFavorite =
		userProfile?.favoritePrompts?.includes(params.id as string) ?? false

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

	const isLoading = isPromptLoading

	const renderContent = () => {
		if (isLoading) {
			return <PromptDetailSkeleton />
		}

		if (!prompt) {
			return <p>Prompt not found.</p>
		}

		const authorDisplayName = prompt.authorDisplayName ?? 'Anonymous'
		const authorPhotoURL = prompt.authorPhotoURL ?? ''
		const authorInitial = authorDisplayName.charAt(0)
		const promptImage = prompt.images?.[0]
		const categoryId = prompt.categoryId ?? prompt.categories?.[0]
		const categoryNames = getNames(categoryId)

		return (
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12'>
				{/* Left Column: Image Gallery */}
				<div className='space-y-4'>
					<div className='w-full overflow-hidden rounded-lg border bg-muted'>
						{promptImage && (
							<Image
								src={promptImage}
								alt={prompt.title}
								width={720}
								height={1280}
								className='w-full h-auto object-contain'
								priority
								unoptimized
							/>
						)}
					</div>
					{/* Thumbnail images could go here */}
				</div>

				{/* Right Column: Prompt Details */}
				<div className='space-y-6'>
					<div className='space-y-2'>
						<h1 className='font-headline text-3xl md:text-4xl font-bold'>
							{prompt.title}
						</h1>
						<div className='flex items-center gap-4'>
							<Avatar>
								<AvatarImage src={authorPhotoURL} alt={authorDisplayName} />
								<AvatarFallback>{authorInitial}</AvatarFallback>
							</Avatar>
							<span className='font-semibold'>{authorDisplayName}</span>
						</div>
					</div>

					<div className='flex items-center gap-4'>
						<div className='flex items-center gap-1'>
							<Star className='h-5 w-5 fill-yellow-400 text-yellow-500' />
							<span className='font-bold'>
								{prompt.rating.average.toFixed(1)}
							</span>
							<span className='text-sm text-muted-foreground'>
								({prompt.rating.count} ratings)
							</span>
						</div>
						{user && (
							<Button
								variant='ghost'
								size='icon'
								onClick={handleToggleFavorite}
								aria-label='Toggle Favorite'
							>
								<Heart
									className={cn(
										'h-6 w-6 transition-colors',
										isFavorite
											? 'fill-red-500 text-red-500'
											: 'text-muted-foreground',
									)}
								/>
							</Button>
						)}
					</div>

					<div className='flex flex-wrap gap-2'>
						{categoryNames.map(name => (
							<Badge key={name} variant='secondary'>
								{name}
							</Badge>
						))}
						{Array.isArray(prompt.tags) &&
							prompt.tags.map(tag => (
								<Badge key={tag} variant='outline'>
									{tag}
								</Badge>
							))}
					</div>

					<p className='text-muted-foreground'>{prompt.description}</p>

					<div className='rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4'>
						<div className='flex flex-wrap items-center justify-between gap-4'>
							<h2 className='text-2xl font-bold'>
								{prompt.price === 0
									? 'Free'
									: `€${(Number(prompt.price) ?? 0).toFixed(2)}`}
							</h2>
							<div className='flex flex-grow justify-end items-center gap-2 sm:flex-grow-0'>
								<Button
									size='lg'
									variant='outline'
									onClick={handleAddToCart}
									className='flex-1 sm:flex-initial'
									disabled={!user}
								>
									<ShoppingCart className='mr-2 h-4 w-4' />
									Add to Cart
								</Button>
								<Button
									size='lg'
									className='bg-accent text-accent-foreground hover:bg-accent/90 flex-1 sm:flex-initial'
									asChild
								>
									<Link href={`/checkout?promptId=${prompt.id}`}>Buy Now</Link>
								</Button>
							</div>
						</div>
						<div className='p-8 bg-muted rounded-lg text-center relative'>
							<div className='absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg'>
								<div className='text-center font-bold text-lg'>
									Unlock to view prompt
								</div>
							</div>
							<p className='text-muted-foreground italic line-clamp-3'>
								"A hyper-realistic 4K image of a majestic lion with a flowing
								mane, set against a backdrop of a golden sunset on the African
								savanna. The lighting should be dramatic, with long shadows and
								a warm, orange glow. The lion's expression should be noble and
								powerful. Use a shallow depth of field to isolate the lion from
								the background. Shot on a Sony A7R IV with a 200mm f/2.8 lens."
							</p>
						</div>
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

				{/* Comments & Ratings Section */}
				<div className='mt-12 pt-8 border-t'>
					<h2 className='font-headline text-2xl font-bold mb-6'>Reviews</h2>
					{/* AddComment and CommentList components will go here */}
					<div className='space-y-6'>
						<p className='text-muted-foreground'>Comments coming soon.</p>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	)
}
