'use client'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { useFirestore } from '@/firebase'
import { deletePromptComment } from '@/firebase/prompts'
import { useToast } from '@/hooks/use-toast'
import type { AdminComment, Prompt } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
	collection,
	doc,
	documentId,
	getDocs,
	query,
	where,
	Timestamp,
} from 'firebase/firestore'
import { format, formatDistanceToNow } from 'date-fns'
import { MoreHorizontal, Pencil, Star, Trash } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EditCommentDialog } from './edit-comment-dialog'

interface CommentsTableProps {
	comments: AdminComment[]
}

export function CommentsTable({ comments }: CommentsTableProps) {
	const { toast } = useToast()
	const firestore = useFirestore()

	const [commentToDelete, setCommentToDelete] = useState<AdminComment | null>(
		null,
	)
	const [commentToEdit, setCommentToEdit] = useState<AdminComment | null>(null)
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [promptTitles, setPromptTitles] = useState<Record<string, string>>({})

	useEffect(() => {
		if (!firestore || comments.length === 0) return

		const fetchPromptTitles = async () => {
			const promptIds = [...new Set(comments.map(c => c.promptId))]
			if (promptIds.length === 0) return

			const chunks: string[][] = []
			for (let i = 0; i < promptIds.length; i += 30) {
				chunks.push(promptIds.slice(i, i + 30))
			}

			const titles: Record<string, string> = {}
			try {
				for (const chunk of chunks) {
					const q = query(
						collection(firestore, 'prompts'),
						where(documentId(), 'in', chunk),
					)
					const snapshot = await getDocs(q)
					snapshot.forEach(doc => {
						titles[doc.id] = (doc.data() as Prompt).title
					})
				}
				setPromptTitles(titles)
			} catch (error) {
				console.error('Error fetching prompt titles:', error)
			}
		}

		fetchPromptTitles()
	}, [firestore, comments])

	const handleDelete = async () => {
		if (!commentToDelete || !firestore) return

		try {
			await deletePromptComment({
				firestore,
				promptId: commentToDelete.promptId,
				userId: commentToDelete.userId,
			})
			toast({
				title: 'Comment Deleted',
				description: 'The comment has been successfully deleted.',
			})
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error Deleting Comment',
				description: error.message || 'An unknown error occurred.',
			})
		} finally {
			setCommentToDelete(null)
		}
	}

	const handleEditClick = (comment: AdminComment) => {
		setCommentToEdit(comment)
		setIsEditOpen(true)
	}

	const renderRating = (rating: number) => (
		<div className='flex items-center gap-0.5'>
			{[1, 2, 3, 4, 5].map(star => (
				<Star
					key={star}
					className={cn(
						'h-4 w-4',
						rating >= star
							? 'text-yellow-400 fill-yellow-400'
							: 'text-muted-foreground/50',
					)}
				/>
			))}
		</div>
	)

	return (
		<>
			{/* Mobile Card View */}
			<div className='md:hidden space-y-4'>
				{comments.map(comment => (
					<Card key={`${comment.promptId}-${comment.id}`}>
						<CardContent className='p-4'>
							<div className='flex gap-3'>
								<Avatar className='h-10 w-10 border hidden sm:flex'>
									<AvatarImage
										src={comment.authorPhotoURL}
										alt={comment.authorDisplayName}
									/>
									<AvatarFallback>
										{comment.authorDisplayName?.charAt(0) ?? 'A'}
									</AvatarFallback>
								</Avatar>
								<div className='flex-1'>
									<div className='flex justify-between items-start'>
										<div>
											<p className='font-semibold text-sm'>
												{comment.authorDisplayName}
											</p>
											<div className='flex items-center gap-2'>
												{renderRating(comment.rating)}
												<span className='text-xs text-muted-foreground'>
													{comment.timestamp instanceof Timestamp
														? formatDistanceToNow(
																comment.timestamp.toDate(),
																{
																	addSuffix: true,
																},
															)
														: 'N/A'}
												</span>
											</div>
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													aria-haspopup='true'
													size='icon'
													variant='ghost'
													className='-mt-2 -mr-2 h-8 w-8'
												>
													<MoreHorizontal className='h-4 w-4' />
													<span className='sr-only'>Toggle menu</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuItem onSelect={() => handleEditClick(comment)}>
													<Pencil className='mr-2 h-4 w-4' /> Edit
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className='text-destructive focus:text-destructive'
													onSelect={() => setCommentToDelete(comment)}
												>
													<Trash className='mr-2 h-4 w-4' /> Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>

									<div className='mt-3'>
										<Link
											href={`/prompt/${comment.promptId}`}
											className='text-sm font-medium text-muted-foreground hover:underline block'
										>
											On prompt:{' '}
											<span className='text-foreground'>
												{promptTitles[comment.promptId] || 'View Prompt'}
											</span>
										</Link>
										<p
											className='mt-2 text-base bg-muted/50 p-3 rounded-md'
											title={comment.text}
										>
											{comment.text}
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Desktop Table View */}
			<div className='rounded-md border hidden md:block'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Author</TableHead>
							<TableHead>Prompt</TableHead>
							<TableHead>Comment</TableHead>
							<TableHead className='w-[120px] text-center'>Rating</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>
								<span className='sr-only'>Actions</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{comments.map(comment => (
							<TableRow key={`${comment.promptId}-${comment.id}`}>
								<TableCell>
									<div className='flex items-center gap-3'>
										<Avatar className='h-9 w-9'>
											<AvatarImage
												src={comment.authorPhotoURL}
												alt={comment.authorDisplayName}
											/>
											<AvatarFallback>
												{comment.authorDisplayName?.charAt(0) ?? 'A'}
											</AvatarFallback>
										</Avatar>
										<div className='font-medium'>
											{comment.authorDisplayName}
										</div>
									</div>
								</TableCell>
								<TableCell>
									<Link
										href={`/prompt/${comment.promptId}`}
										className='hover:underline font-medium'
									>
										{promptTitles[comment.promptId] || 'View Prompt'}
									</Link>
								</TableCell>
								<TableCell>
									<p className='max-w-xs truncate' title={comment.text}>
										{comment.text}
									</p>
								</TableCell>
								<TableCell className='text-center'>
									<div className='flex items-center justify-center gap-1'>
										{comment.rating}{' '}
										<Star className='h-4 w-4 text-yellow-400 fill-yellow-400' />
									</div>
								</TableCell>
								<TableCell>
									{comment.timestamp instanceof Timestamp
										? format(comment.timestamp.toDate(), 'PPP')
										: 'N/A'}
								</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button aria-haspopup='true' size='icon' variant='ghost'>
												<MoreHorizontal className='h-4 w-4' />
												<span className='sr-only'>Toggle menu</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align='end'>
											<DropdownMenuLabel>Actions</DropdownMenuLabel>
											<DropdownMenuItem onSelect={() => handleEditClick(comment)}>
												<Pencil className='mr-2 h-4 w-4' /> Edit
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className='text-destructive focus:text-destructive'
												onSelect={() => setCommentToDelete(comment)}
											>
												<Trash className='mr-2 h-4 w-4' /> Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<AlertDialog
				open={!!commentToDelete}
				onOpenChange={open => !open && setCommentToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							comment and recalculate the prompt's average rating.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className='bg-destructive hover:bg-destructive/90'
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{commentToEdit && (
				<EditCommentDialog
					comment={commentToEdit}
					isOpen={isEditOpen}
					onOpenChange={setIsEditOpen}
				/>
			)}
		</>
	)
}
