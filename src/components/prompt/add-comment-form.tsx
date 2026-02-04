'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { PromptComment } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Loader2, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AddCommentFormProps {
	promptId: string
	initialData?: PromptComment
	isSubmitting: boolean
	onSubmit: (data: { rating: number; text: string }) => Promise<void>
	onCancel?: () => void
	submitButtonText: string
}

export function AddCommentForm({
	promptId,
	initialData,
	isSubmitting,
	onSubmit,
	onCancel,
	submitButtonText,
}: AddCommentFormProps) {
	const [rating, setRating] = useState(initialData?.rating || 0)
	const [hoverRating, setHoverRating] = useState(0)
	const [text, setText] = useState(initialData?.text || '')
	const [error, setError] = useState('')

	useEffect(() => {
		setRating(initialData?.rating || 0)
		setText(initialData?.text || '')
	}, [initialData])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (rating === 0) {
			setError('Please select a rating.')
			return
		}
		setError('')
		await onSubmit({ rating, text })
	}

	return (
		<form
			onSubmit={handleSubmit}
			className='space-y-4 rounded-lg border p-4 sm:p-6'
		>
			<h3 className='font-semibold'>
				{initialData ? 'Edit Your Review' : 'Leave a Review'}
			</h3>
			<div>
				<div className='flex items-center gap-1'>
					{[1, 2, 3, 4, 5].map(star => (
						<Star
							key={star}
							className={cn(
								'h-6 w-6 cursor-pointer transition-colors',
								(hoverRating || rating) >= star
									? 'text-yellow-500 fill-yellow-400'
									: 'text-muted-foreground',
							)}
							onClick={() => !isSubmitting && setRating(star)}
							onMouseEnter={() => !isSubmitting && setHoverRating(star)}
							onMouseLeave={() => setHoverRating(0)}
						/>
					))}
				</div>
				{error && <p className='text-xs text-destructive mt-1'>{error}</p>}
			</div>
			<Textarea
				value={text}
				onChange={e => setText(e.target.value)}
				placeholder='Share your thoughts about this prompt... (optional)'
				rows={4}
				disabled={isSubmitting}
			/>
			<div className='flex items-center gap-2'>
				<Button type='submit' disabled={isSubmitting}>
					{isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
					{submitButtonText}
				</Button>
				{onCancel && (
					<Button
						type='button'
						variant='ghost'
						onClick={onCancel}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
				)}
			</div>
		</form>
	)
}
