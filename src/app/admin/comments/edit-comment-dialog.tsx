'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from '@/components/ui/dialog'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useFirestore } from '@/firebase'
import { updatePromptComment } from '@/firebase/prompts'
import type { AdminComment } from '@/lib/types'
import { useEffect, useState } from 'react'
import { Loader2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

const editCommentSchema = z.object({
	text: z.string().optional(),
	rating: z.number().min(1).max(5),
})

type EditCommentFormValues = z.infer<typeof editCommentSchema>

interface EditCommentDialogProps {
	comment: AdminComment | null
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
}

export function EditCommentDialog({
	comment,
	isOpen,
	onOpenChange,
}: EditCommentDialogProps) {
	const { toast } = useToast()
	const firestore = useFirestore()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [hoverRating, setHoverRating] = useState(0)

	const form = useForm<EditCommentFormValues>({
		resolver: zodResolver(editCommentSchema),
	})

	useEffect(() => {
		if (comment) {
			form.reset({
				text: comment.text || '',
				rating: comment.rating,
			})
		}
	}, [comment, form])

	const handleSubmit = async (data: EditCommentFormValues) => {
		if (!comment || !firestore) return

		setIsSubmitting(true)
		try {
			await updatePromptComment({
				firestore,
				promptId: comment.promptId,
				userId: comment.userId,
				text: data.text || '',
				rating: data.rating,
			})
			toast({
				title: 'Comment Updated',
				description: 'The comment has been successfully saved.',
			})
			onOpenChange(false)
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error Updating Comment',
				description: error.message,
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Comment</DialogTitle>
					<DialogDescription>
						Update the rating or content of this review.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className='space-y-4 py-4'
					>
						<FormField
							control={form.control}
							name='rating'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Rating</FormLabel>
									<FormControl>
										<div className='flex items-center gap-1'>
											{[1, 2, 3, 4, 5].map(star => (
												<Star
													key={star}
													className={cn(
														'h-6 w-6 cursor-pointer transition-colors',
														(hoverRating || field.value) >= star
															? 'text-yellow-500 fill-yellow-400'
															: 'text-muted-foreground',
													)}
													onClick={() => !isSubmitting && field.onChange(star)}
													onMouseEnter={() =>
														!isSubmitting && setHoverRating(star)
													}
													onMouseLeave={() => setHoverRating(0)}
												/>
											))}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='text'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Comment Text</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											rows={5}
											placeholder='The user did not leave a comment.'
											disabled={isSubmitting}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<DialogClose asChild>
								<Button
									type='button'
									variant='outline'
									disabled={isSubmitting}
								>
									Cancel
								</Button>
							</DialogClose>
							<Button type='submit' disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								)}
								Save Changes
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}