'use client'

import { Badge } from '@/components/ui/badge'
import { useCategories } from '@/hooks/use-categories'
import type { Prompt, UserProfile } from '@/lib/types'
import { Coins, Eye, Heart, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Skeleton } from '../ui/skeleton'
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import { toggleFavoritePrompt } from '@/firebase/users'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { doc } from 'firebase/firestore'
import React from 'react'
import { PlaceHolderImages } from '@/lib/placeholder-images'

type PromptCardProps = {
	prompt: Prompt
	isInCart?: boolean
}

const formatStat = (num: number): string => {
	if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`
	if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
	return num.toString()
}

export default function PromptCard({ prompt, isInCart }: PromptCardProps) {
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

		toggleFavoritePrompt(firestore, user.uid, prompt.id, isFavorite)

		toast({
			title: isFavorite ? 'Removed from favorites' : 'Added to favorites',
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

	return (
		<div>
			<div className='group relative w-full overflow-hidden rounded-2xl bg-card'>
				<Link href={`/prompt/${prompt.id}`} className='block cursor-pointer'>
					{imageUrl ? (
						<Image
							src={imageUrl}
							alt={prompt.title}
							width={imageWidth}
							height={imageHeight}
							className='w-full h-auto object-cover transition-transform duration-300 ease-in-out group-hover:scale-105'
						/>
					) : (
						<Skeleton className='w-full aspect-[4/5]' />
					)}
				</Link>

				<div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
					<div className='absolute bottom-0 left-0 right-0 p-4 text-white'>
						<h3 className='font-bold text-base leading-tight truncate'>
							{prompt.title}
						</h3>
						{prompt.stats && (
							<div className='mt-1.5 flex items-center justify-between text-xs text-neutral-300'>
								<div className='flex items-center gap-3'>
									<span className='flex items-center gap-1'>
										<Eye className='h-4 w-4' />
										{formatStat(prompt.stats.views)}
									</span>
									<span className='flex items-center gap-1'>
										<ShoppingBag className='h-4 w-4' />
										{formatStat(prompt.stats.sales)}
									</span>
								</div>
								{categoryNames[0] && (
									<Badge
										variant='secondary'
										className='bg-white/20 text-white backdrop-blur-sm border-0 font-medium'
									>
										{categoryNames[0]}
									</Badge>
								)}
							</div>
						)}
					</div>
				</div>

				{isInCart && (
					<span className='absolute top-3 left-3 z-10 flex items-center gap-1 rounded-md bg-primary/90 px-2 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm'>
						<ShoppingBag className='h-3.5 w-3.5' />
						In cart
					</span>
				)}
				{user && (
					<button
						onClick={handleToggleFavorite}
						className='absolute top-3 right-3 z-10 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50 opacity-0 group-hover:opacity-100'
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

				<div className='absolute bottom-3 right-3 z-10'>
					<Badge className='flex items-center gap-1'>
						<Coins className='h-3.5 w-3.5' />
						{prompt.price === 0 ? 'Free' : creditPrice}
					</Badge>
				</div>
			</div>
		</div>
	)
}
