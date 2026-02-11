'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useFirestore } from '@/firebase'
import { AdminComment, PromptComment } from '@/lib/types'
import {
	collectionGroup,
	onSnapshot,
	orderBy,
	query,
} from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CommentsTable } from './comments-table'

export default function AdminCommentsPage() {
	const firestore = useFirestore()
	const [comments, setComments] = useState<AdminComment[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [currentPage, setCurrentPage] = useState(1)

	useEffect(() => {
		if (!firestore) return

		const q = query(
			collectionGroup(firestore, 'comments'),
			orderBy('timestamp', 'desc'),
		)

		const unsubscribe = onSnapshot(
			q,
			snapshot => {
				const fetchedComments = snapshot.docs.map(doc => {
					const promptId = doc.ref.parent.parent!.id
					return {
						...(doc.data() as PromptComment),
						id: doc.id,
						promptId: promptId,
					}
				})
				setComments(fetchedComments)
				setLoading(false)
				setError(null)
			},
			err => {
				console.error('Failed to fetch comments:', err)
				setError(err)
				setLoading(false)
			},
		)

		return () => unsubscribe()
	}, [firestore])

	const pageCount = Math.ceil(comments.length / itemsPerPage)
	const paginatedComments = comments.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	)

	const renderContent = () => {
		if (loading) {
			return (
				<div className='flex justify-center items-center h-64'>
					<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
				</div>
			)
		}

		if (error) {
			return (
				<p className='text-destructive'>Error loading comments: {error.message}</p>
			)
		}

		if (paginatedComments.length === 0) {
			return <p>No comments found.</p>
		}

		return <CommentsTable comments={paginatedComments} />
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between gap-4'>
				<h1 className='text-lg font-semibold md:text-2xl'>Comment Manager</h1>
			</div>
			<Card>
				<CardHeader>
					<div className='flex items-start justify-between gap-4'>
						<div>
							<CardTitle>All Comments</CardTitle>
							<CardDescription>
								Manage user feedback. Reviews are sorted by date (newest first).
							</CardDescription>
						</div>
						<Select
							value={`${itemsPerPage}`}
							onValueChange={value => {
								setItemsPerPage(Number(value))
								setCurrentPage(1)
							}}
						>
							<SelectTrigger className='w-auto gap-2'>
								<SelectValue placeholder='Items per page' />
							</SelectTrigger>
							<SelectContent>
								{[10, 20, 50].map(pageSize => (
									<SelectItem key={pageSize} value={`${pageSize}`}>
										{pageSize} per page
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent>{renderContent()}</CardContent>
				{pageCount > 1 && (
					<CardFooter className='justify-between'>
						<div className='text-sm text-muted-foreground'>
							Page {currentPage} of {pageCount}
						</div>
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
										disabled={currentPage === 1}
									/>
								</PaginationItem>
								{Array.from({ length: pageCount }, (_, i) => i + 1).map(
									page => (
										<PaginationItem key={page}>
											<PaginationLink
												onClick={() => setCurrentPage(page)}
												isActive={currentPage === page}
											>
												{page}
											</PaginationLink>
										</PaginationItem>
									),
								)}
								<PaginationItem>
									<PaginationNext
										onClick={() =>
											setCurrentPage(p => Math.min(pageCount, p + 1))
										}
										disabled={currentPage === pageCount}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</CardFooter>
				)}
			</Card>
		</div>
	)
}