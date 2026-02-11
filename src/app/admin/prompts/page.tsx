'use client'

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import {
	collection,
	orderBy,
	query,
	where,
	type QueryConstraint,
} from 'firebase/firestore'
import type { Prompt } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { Loader2, PlusCircle } from 'lucide-react'
import { PromptsTable } from './prompts-table'
import { Scraper } from './scraper'
import { useState } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination'

export default function AdminPromptsPage() {
	const firestore = useFirestore()
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [currentPage, setCurrentPage] = useState(1)

	// Since useCollection doesn't support pagination out of the box for this app's
	// structure, we'll fetch all and paginate on the client. This is suitable for
	// admin panels with a moderate number of documents. For very large collections,
	// a more complex server-side pagination hook would be needed.
	const promptsQuery = useMemoFirebase(
		() =>
			firestore
				? query(collection(firestore, 'prompts'), orderBy('createdAt', 'desc'))
				: null,
		[firestore],
	)
	const { data: prompts, isLoading, error } = useCollection<Prompt>(promptsQuery)

	const pageCount = prompts ? Math.ceil(prompts.length / itemsPerPage) : 0
	const paginatedPrompts = prompts?.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	)

	const renderContent = () => {
		if (isLoading) {
			return (
				<div className='flex justify-center items-center h-64'>
					<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
				</div>
			)
		}

		if (error) {
			return (
				<p className='text-destructive'>Error loading prompts: {error.message}</p>
			)
		}

		if (!paginatedPrompts || paginatedPrompts.length === 0) {
			return <p>No prompts found. Add one to get started!</p>
		}

		return <PromptsTable prompts={paginatedPrompts} />
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between gap-4'>
				<h1 className='text-lg font-semibold md:text-2xl'>Prompt Manager</h1>
				<Button asChild>
					<Link href='/admin/prompts/new'>
						<PlusCircle className='mr-2 h-4 w-4' />
						Add New Prompt
					</Link>
				</Button>
			</div>

			<Scraper />

			<Card>
				<CardHeader>
					<div className='flex items-start justify-between gap-4'>
						<div>
							<CardTitle>All Prompts</CardTitle>
							<CardDescription>
								A list of all prompts in the marketplace. You can edit or delete
								them here.
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