'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import type { PromptComment } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { Star } from 'lucide-react'

interface CommentListProps {
	comments: PromptComment[]
	isLoading: boolean
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

export function CommentList({ comments, isLoading }: CommentListProps) {
	if (isLoading && comments.length === 0) {
		return (
			<div className='space-y-4'>
				<CommentSkeleton />
				<CommentSkeleton />
			</div>
		)
	}

	if (comments.length === 0) {
		return (
			<p className='text-muted-foreground text-center py-4'>
				No other reviews yet.
			</p>
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
							<span className='font-semibold'>
								{comment.authorDisplayName ?? 'Anonymous'}
							</span>
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
