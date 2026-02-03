'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import type { PromptComment } from '@/lib/types'
import { collection, orderBy, query } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { Star } from 'lucide-react'

interface CommentListProps {
	promptId: string
}

const CommentSkeleton = () => (
	<Card className='p-4'>
		<div className='flex gap-4'>
			<Skeleton className='h-10 w-10 rounded-full' />
			<div className='flex-1 space-y-2'>
				<Skeleton className='h-4 w-1/4' />
				<Skeleton className='h-4 w-1/2' />
				<Skeleton className='h-8 w-full' />
			</div>
		</div>
	</Card>
)

export function CommentList({ promptId }: CommentListProps) {
	const firestore = useFirestore()

	const commentsQuery = useMemoFirebase(
		() =>
			firestore && promptId
				? query(
						collection(firestore, 'prompts', promptId, 'comments'),
						orderBy('timestamp', 'desc'),
					)
				: null,
		[firestore, promptId],
	)

	const {
		data: comments,
		isLoading,
		error,
	} = useCollection<PromptComment>(commentsQuery)

	if (isLoading) {
		return (
			<div className='space-y-4'>
				<CommentSkeleton />
				<CommentSkeleton />
			</div>
		)
	}

	if (error) {
		return <p className='text-destructive'>Error loading reviews.</p>
	}

	if (!comments || comments.length === 0) {
		return <p className='text-muted-foreground'>No reviews yet. Be the first!</p>
	}

	return (
		<div className='space-y-6'>
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
