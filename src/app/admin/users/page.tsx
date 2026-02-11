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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import type { UserProfile } from '@/lib/types'
import { collection, query } from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { UsersTable } from './users-table'

export default function AdminUsersPage() {
	const firestore = useFirestore()
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [currentPage, setCurrentPage] = useState(1)

	const usersQuery = useMemoFirebase(
		() => (firestore ? query(collection(firestore, 'users')) : null),
		[firestore],
	)
	const { data: users, isLoading, error } = useCollection<UserProfile>(usersQuery)

	const pageCount = users ? Math.ceil(users.length / itemsPerPage) : 0
	const paginatedUsers = users?.slice(
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
				<p className='text-destructive'>Error loading users: {error.message}</p>
			)
		}

		if (!paginatedUsers || paginatedUsers.length === 0) {
			return <p>No users found.</p>
		}

		return <UsersTable users={paginatedUsers} />
	}

	return (
		<>
			<div className='flex items-center'>
				<h1 className='text-lg font-semibold md:text-2xl'>User Manager</h1>
			</div>
			<Card>
				<CardHeader>
					<div className='flex items-start justify-between gap-4'>
						<div>
							<CardTitle>All Users</CardTitle>
							<CardDescription>Manage user roles and profiles.</CardDescription>
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
					<CardFooter className='justify-end'>
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
		</>
	)
}
