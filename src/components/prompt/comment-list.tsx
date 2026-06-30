'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { PromptComment } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { Crown, Star } from 'lucide-react'

interface CommentListProps {
	comments: PromptComment[]
	isLoading: boolean
	hasUserComment?: boolean
}

const CommentSkeleton = () => (
	<div className='flex gap-4 p-4'>
		<Skeleton className='h-10 w-10 rounded-full' />
		<div className='flex-1 space-y-2'>
			<Skeleton className='h-4 w-1/4' />
			<Skeleton className='h-4 w-1/2' />
			<Skeleton className='h-8 w-full' />
		</div>
	</div>
)

export function CommentList({
	comments,
	isLoading,
	hasUserComment,
}: CommentListProps) {
	if (isLoading && comments.length === 0) {
		return (
			<div className='space-y-4'>
				<CommentSkeleton />
				<CommentSkeleton />
			</div>
		)
	}

	if (comments.length === 0) {
		if (hasUserComment) {
			return null // If user has commented, don't show "no other reviews"
		}
		return (
			<p className='text-muted-foreground text-center py-4'>No reviews yet.</p>
		)
	}

	return (
		<div className='space-y-6'>
			<h3 className='font-semibold'>All Reviews</h3>
			{comments.map(comment => (
				<div key={comment.id} className='flex gap-4'>
					<Avatar>
						<AvatarImage
							src={comment.authorPhotoURL}
							alt={comment.authorDisplayName}
						/>
						<AvatarFallback>
							{comment.authorDisplayName?.charAt(0) ?? 'U'}
						</AvatarFallback>
					</Avatar>
					<div className='flex-1'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<span className='font-semibold'>
									{comment.authorDisplayName ?? 'Anonymous'}
								</span>
								{comment.authorPlanId === 'pro' && (
									<Badge className='bg-primary text-primary-foreground text-xs px-1.5 py-0'>
										<Crown className='mr-1 h-3 w-3' /> PRO
									</Badge>
								)}
								{comment.authorPlanId === 'starter' && (
									<Badge variant='secondary' className='text-xs px-1.5 py-0'>
										<Star className='mr-1 h-3 w-3' /> Starter
									</Badge>
								)}
							</div>
							<span className='text-xs text-muted-foreground'>
								{comment.timestamp
									? formatDistanceToNow(comment.timestamp.toDate(), {
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
										comment.rating >= star
											? 'text-yellow-500 fill-yellow-400'
											: 'text-muted-foreground'
									}`}
								/>
							))}
						</div>
						<p className='text-sm text-foreground/80'>{comment.text}</p>
					</div>
				</div>
			))}
		</div>
	)
}
