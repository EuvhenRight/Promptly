'use client'

import { Badge } from '@/components/ui/badge'
import { useCategories } from '@/hooks/use-categories'
import type { Prompt, UserProfile } from '@/lib/types'
import { Check, Coins, Crown, Eye, Heart, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Skeleton } from '../ui/skeleton'
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import { toggleFavoritePrompt } from '@/firebase/users'
import { useToast } from '@/hooks/use-toast'
import { cn, isFirebaseStorageUrl } from '@/lib/utils'
import { doc } from 'firebase/firestore'
import React from 'react'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { addPromptToCart } from '@/firebase/cart'
import { Button } from '../ui/button'

type PromptCardProps = {
	prompt: Prompt
	isInCart?: boolean
	isPurchased?: boolean
	index: number
}

const formatStat = (num: number): string => {
	if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`
	if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
	return num.toString()
}

export default function PromptCard({
	prompt,
	isInCart,
	isPurchased,
	index,
}: PromptCardProps) {
	const { getNames } = useCategories()
	const categoryId = prompt.categoryId ?? prompt.categories?.[0]
	const categoryNames = getNames(categoryId)

	const { user } = useUser()
	const firestore = useFirestore()
	const { toast } = useToast()

	const userProfileRef = useMemoFirebase(
		() => (user ? doc(firestore, 'users', user.uid) : null),
		[firestore, user],
	)
	const { data: userProfile } = useDoc<UserProfile>(userProfileRef)

	const isFavorite = userProfile?.favoritePrompts?.includes(prompt.id) ?? false

	const handleToggleFavorite = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (!user || !firestore) {
			toast({
				variant: 'destructive',
				title: 'Please sign in',
				description: 'You need to be signed in to favorite prompts.',
			})
			return
		}

		void toggleFavoritePrompt(firestore, user.uid, prompt.id, isFavorite)

		toast({
			title: isFavorite ? 'Removed from favorites' : 'Added to favorites',
		})
	}

	const handleAddToCart = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		addPromptToCart(user ? firestore : null, user?.uid ?? null, prompt.id)

		toast({
			title: 'Added to cart',
			description: `"${prompt.title}" has been added to your cart.`,
		})
	}

	const imageIdentifier = prompt.images?.[0]
	let imageUrl: string | undefined
	let imageWidth: number = 400
	let imageHeight: number = 500

	if (imageIdentifier) {
		if (imageIdentifier.startsWith('http')) {
			imageUrl = imageIdentifier
		} else {
			const imageData = PlaceHolderImages.find(p => p.id === imageIdentifier)
			if (imageData) {
				imageUrl = imageData.imageUrl
				imageWidth = imageData.width
				imageHeight = imageData.height
			}
		}
	}

	const creditPrice = Math.round(prompt.price * 100)

	const isFirebaseStorage = isFirebaseStorageUrl(imageUrl)

	// 3-tier loading strategy based on your recommendation
	const isPriority = index < 3 // First 3 images are critical
	const isEager = index >= 3 && index < 8 // Next 5 are loaded eagerly

	const imageProps: React.ComponentProps<typeof Image> = {
		src: imageUrl!,
		alt: prompt.title,
		width: imageWidth,
		height: imageHeight,
		sizes:
			'(max-width: 767px) 100vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw',
		quality: 75,
		unoptimized: isFirebaseStorage,
		className:
			'w-full h-auto object-cover transition-transform duration-300 ease-in-out group-hover:scale-105',
		...(isPriority ? { priority: true } : isEager ? { loading: 'eager' as const } : { loading: 'lazy' as const }),
	}

	return (
		<div>
			<div className='group relative w-full overflow-hidden rounded-2xl bg-card'>
				<Link href={`/prompt/${prompt.id}`} className='block cursor-pointer'>
					{imageUrl ? (
						<Image {...imageProps} />
					) : (
						<Skeleton className='w-full aspect-[4/5]' />
					)}
				</Link>

				<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
					<div className='absolute bottom-0 left-0 right-0 p-4 text-white'>
						<h3 className='font-bold text-base leading-tight truncate'>
							{prompt.title}
						</h3>
						<div className='mt-1.5 space-y-1.5 text-xs text-neutral-300'>
							{prompt.stats && (
								<div className='flex items-center gap-3'>
									<span className='flex items-center gap-1'>
										<Eye className='h-4 w-4' />
										{formatStat(prompt.stats.views)}
									</span>
									<span className='flex items-center gap-1'>
										<ShoppingCart className='h-4 w-4' />
										{formatStat(prompt.stats.sales)}
									</span>
								</div>
							)}
							{categoryNames[0] && (
								<div>
									<Badge
										variant='secondary'
										className='bg-white/20 text-white backdrop-blur-sm border-0 font-medium'
									>
										{categoryNames[0]}
									</Badge>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className='absolute top-3 left-3 z-10'>
					{prompt.isPrivate && (
						<Badge className='bg-primary text-primary-foreground'>
							<Crown className='mr-1 h-3 w-3' />
							PRO
						</Badge>
					)}
				</div>

				<div className='absolute top-3 right-3 z-10 flex flex-col items-end gap-2 opacity-0 transition-opacity group-hover:opacity-100'>
					{user && (
						<button
							onClick={handleToggleFavorite}
							className='flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity hover:bg-black/80'
							aria-label='Like prompt'
						>
							<Heart
								className={cn(
									'h-5 w-5',
									isFavorite && 'fill-red-500 text-red-500',
								)}
							/>
						</button>
					)}
					{prompt.price > 0 && !isPurchased && (
						<Button
							size='icon'
							onClick={handleAddToCart}
							disabled={isInCart}
							className='flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity hover:bg-black/80'
							aria-label={isInCart ? 'In Cart' : 'Add to Cart'}
						>
							{isInCart ? (
								<Check className='h-5 w-5' />
							) : (
								<ShoppingCart className='h-5 w-5' />
							)}
						</Button>
					)}
				</div>

				<div className='absolute bottom-4 right-4 z-10'>
					{isPurchased ? (
						<Badge
							variant='secondary'
							className='flex items-center gap-1 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800'
						>
							<Check className='h-3.5 w-3.5' />
							Owned
						</Badge>
					) : (
						<Badge className='flex items-center gap-1'>
							<Coins className='h-3.5 w-3.5' />
							{prompt.price === 0 ? 'Free' : creditPrice}
						</Badge>
					)}
				</div>
			</div>
		</div>
	)
}
