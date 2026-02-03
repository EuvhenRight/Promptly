'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useFirestore, useUser } from '@/firebase'
import { addPromptCommentAndRating } from '@/firebase/prompts'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'
import { useState } from 'react'

interface AddCommentFormProps {
	promptId: string
}

export function AddCommentForm({ promptId }: AddCommentFormProps) {
	const { user } = useUser()
	const firestore = useFirestore()
	const { toast } = useToast()
	const [rating, setRating] = useState(0)
	const [hoverRating, setHoverRating] = useState(0)
	const [text, setText] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!user || !firestore) {
			toast({ variant: 'destructive', title: 'You must be signed in.' })
			return
		}
		if (rating === 0) {
			toast({ variant: 'destructive', title: 'Please select a rating.' })
			return
		}

		setIsSubmitting(true)
		try {
			await addPromptCommentAndRating({
				firestore,
				promptId,
				userId: user.uid,
				rating,
				text,
			})
			toast({
				title: 'Review submitted!',
				description: 'Thank you for your feedback.',
			})
			setRating(0)
			setText('')
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error submitting review',
				description: error.message,
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-4 rounded-lg border p-6'>
			<h3 className='font-semibold'>Leave a Review</h3>
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
							onClick={() => setRating(star)}
							onMouseEnter={() => setHoverRating(star)}
							onMouseLeave={() => setHoverRating(0)}
						/>
					))}
				</div>
				<p className='text-xs text-muted-foreground mt-1'>Select your rating</p>
			</div>
			<Textarea
				value={text}
				onChange={e => setText(e.target.value)}
				placeholder='Share your thoughts about this prompt... (optional)'
				rows={4}
				disabled={isSubmitting}
			/>
			<Button type='submit' disabled={isSubmitting}>
				{isSubmitting ? 'Submitting...' : 'Submit Review'}
			</Button>
		</form>
	)
}
