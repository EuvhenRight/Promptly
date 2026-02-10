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
import { collection, doc, documentId, getDocs, query, where } from 'firebase/firestore'
import { format } from 'date-fns'
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

	return (
		<>
			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Author</TableHead>
							<TableHead>Comment</TableHead>
							<TableHead className='w-[120px]'>Rating</TableHead>
							<TableHead className='hidden md:table-cell'>Prompt</TableHead>
							<TableHead className='hidden md:table-cell'>Date</TableHead>
							<TableHead>
								<span className='sr-only'>Actions</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{comments.map(comment => (
							<TableRow key={comment.id}>
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
										<span className='font-medium'>
											{comment.authorDisplayName}
										</span>
									</div>
								</TableCell>
								<TableCell>
									<p className='max-w-xs truncate' title={comment.text}>
										{comment.text}
									</p>
								</TableCell>
								<TableCell>
									<div className='flex items-center gap-1'>
										{comment.rating}{' '}
										<Star className='h-4 w-4 text-yellow-400 fill-yellow-400' />
									</div>
								</TableCell>
								<TableCell className='hidden md:table-cell'>
									<Link
										href={`/prompt/${comment.promptId}`}
										className='hover:underline'
									>
										{promptTitles[comment.promptId] || 'View Prompt'}
									</Link>
								</TableCell>
								<TableCell className='hidden md:table-cell'>
									{comment.timestamp
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
