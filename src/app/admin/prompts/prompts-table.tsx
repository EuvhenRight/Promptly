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
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { useFirestore } from '@/firebase'
import { deletePrompt } from '@/firebase/prompts'
import { useToast } from '@/hooks/use-toast'
import type { Prompt } from '@/lib/types'
import {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronDown,
	MoreHorizontal,
	Pencil,
	Trash,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { PlaceHolderImages } from '@/lib/placeholder-images'

const ActionCell = ({ prompt }: { prompt: Prompt }) => {
	const { toast } = useToast()
	const firestore = useFirestore()
	const [promptToDelete, setPromptToDelete] = React.useState<Prompt | null>(
		null,
	)

	const handleDelete = async () => {
		if (!promptToDelete || !firestore) return

		try {
			await deletePrompt(firestore, promptToDelete.id)
			toast({
				title: 'Prompt Deleted',
				description: `"${promptToDelete.title}" has been successfully deleted.`,
			})
		} catch (error: any) {
			toast({
				variant: 'destructive',
				title: 'Error Deleting Prompt',
				description: error.message || 'An unknown error occurred.',
			})
		} finally {
			setPromptToDelete(null)
		}
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='ghost' className='h-8 w-8 p-0'>
						<span className='sr-only'>Open menu</span>
						<MoreHorizontal className='h-4 w-4' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					<DropdownMenuItem asChild>
						<Link href={`/admin/prompts/edit/${prompt.id}`}>
							<Pencil className='mr-2 h-4 w-4' /> Edit
						</Link>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className='text-destructive focus:text-destructive'
						onSelect={() => setPromptToDelete(prompt)}
					>
						<Trash className='mr-2 h-4 w-4' /> Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<AlertDialog
				open={!!promptToDelete}
				onOpenChange={open => !open && setPromptToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							prompt and its associated private content.
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
		</>
	)
}

export const columns: ColumnDef<Prompt>[] = [
	{
		accessorKey: 'images',
		header: 'Image',
		cell: ({ row }) => {
			const imageIdentifier = row.original.images?.[0]
			let imageUrl: string | undefined

			if (imageIdentifier) {
				if (imageIdentifier.startsWith('http')) {
					imageUrl = imageIdentifier
				} else {
					const imageData = PlaceHolderImages.find(p => p.id === imageIdentifier)
					if (imageData) {
						imageUrl = imageData.imageUrl
					}
				}
			}

			return imageUrl ? (
				<Image
					alt={row.original.title}
					className='aspect-square rounded-md object-cover'
					height='64'
					src={imageUrl}
					width='64'
				/>
			) : (
				<div className='h-16 w-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground'>
					No Image
				</div>
			)
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'title',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
			>
				Title
				{column.getIsSorted() === 'asc' ? (
					<ArrowUp className='ml-2 h-4 w-4' />
				) : column.getIsSorted() === 'desc' ? (
					<ArrowDown className='ml-2 h-4 w-4' />
				) : (
					<ArrowUpDown className='ml-2 h-4 w-4' />
				)}
			</Button>
		),
		cell: ({ row }) => {
			const title = String(row.getValue('title') ?? 'Untitled')
			return (
				<Link
					href={`/prompt/${row.original.id}`}
					className='block max-w-xs truncate font-medium hover:underline'
					title={title}
				>
					{title}
				</Link>
			)
		},
	},
	{
		accessorKey: 'price',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
			>
				Price
				{column.getIsSorted() === 'asc' ? (
					<ArrowUp className='ml-2 h-4 w-4' />
				) : column.getIsSorted() === 'desc' ? (
					<ArrowDown className='ml-2 h-4 w-4' />
				) : (
					<ArrowUpDown className='ml-2 h-4 w-4' />
				)}
			</Button>
		),
		cell: ({ row }) => {
			const price = parseFloat(row.getValue('price'))
			const formatted = new Intl.NumberFormat('de-DE', {
				style: 'currency',
				currency: 'EUR',
			}).format(price)
			return <div className='text-right font-medium'>{formatted}</div>
		},
	},
	{
		accessorKey: 'stats.views',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
			>
				Views
				{column.getIsSorted() === 'asc' ? (
					<ArrowUp className='ml-2 h-4 w-4' />
				) : column.getIsSorted() === 'desc' ? (
					<ArrowDown className='ml-2 h-4 w-4' />
				) : (
					<ArrowUpDown className='ml-2 h-4 w-4' />
				)}
			</Button>
		),
		cell: ({ row }) => (
			<div className='text-center'>
				{row.original.stats?.views?.toLocaleString() ?? 0}
			</div>
		),
	},
	{
		accessorKey: 'stats.sales',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
			>
				Sales
				{column.getIsSorted() === 'asc' ? (
					<ArrowUp className='ml-2 h-4 w-4' />
				) : column.getIsSorted() === 'desc' ? (
					<ArrowDown className='ml-2 h-4 w-4' />
				) : (
					<ArrowUpDown className='ml-2 h-4 w-4' />
				)}
			</Button>
		),
		cell: ({ row }) => (
			<div className='text-center'>
				{row.original.stats?.sales?.toLocaleString() ?? 0}
			</div>
		),
	},
	{
		accessorKey: 'stats.likes',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
			>
				Likes
				{column.getIsSorted() === 'asc' ? (
					<ArrowUp className='ml-2 h-4 w-4' />
				) : column.getIsSorted() === 'desc' ? (
					<ArrowDown className='ml-2 h-4 w-4' />
				) : (
					<ArrowUpDown className='ml-2 h-4 w-4' />
				)}
			</Button>
		),
		cell: ({ row }) => (
			<div className='text-center'>
				{Math.max(0, row.original.stats?.likes ?? 0).toLocaleString()}
			</div>
		),
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
			>
				Created At
				{column.getIsSorted() === 'asc' ? (
					<ArrowUp className='ml-2 h-4 w-4' />
				) : column.getIsSorted() === 'desc' ? (
					<ArrowDown className='ml-2 h-4 w-4' />
				) : (
					<ArrowUpDown className='ml-2 h-4 w-4' />
				)}
			</Button>
		),
		cell: ({ row }) => {
			const createdAt = row.original.createdAt
			return createdAt ? format(createdAt.toDate(), 'PPP') : 'N/A'
		},
	},
	{
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => <ActionCell prompt={row.original} />,
	},
]

interface PromptsTableProps {
	prompts: Prompt[]
}

export function PromptsTable({ prompts }: PromptsTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({})
	const [rowSelection, setRowSelection] = React.useState({})
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	})

	const table = useReactTable({
		data: prompts,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onPaginationChange: setPagination,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
		},
	})

	return (
		<div className='w-full'>
			<div className='flex items-center py-4 gap-4'>
				<Input
					placeholder='Filter by title...'
					value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
					onChange={event =>
						table.getColumn('title')?.setFilterValue(event.target.value)
					}
					className='max-w-sm'
				/>
				<div className='ml-auto flex items-center gap-4'>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={value => {
							table.setPageSize(Number(value))
						}}
					>
						<SelectTrigger className='w-[140px]'>
							<SelectValue placeholder='Select page size' />
						</SelectTrigger>
						<SelectContent>
							{[10, 20, 30, 40, 50].map(pageSize => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize} per page
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline'>
								Columns <ChevronDown className='ml-2 h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							{table
								.getAllColumns()
								.filter(column => column.getCanHide())
								.map(column => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className='capitalize'
											checked={column.getIsVisible()}
											onCheckedChange={value =>
												column.toggleVisibility(!!value)
											}
										>
											{column.id.replace('stats.', '')}
										</DropdownMenuCheckboxItem>
									)
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<div className='relative w-full overflow-auto'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map(row => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
								>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className='h-24 text-center'
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className='flex items-center justify-end space-x-2 py-4'>
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							/>
						</PaginationItem>
						{Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map(
							page => (
								<PaginationItem key={page}>
									<PaginationLink
										onClick={() => table.setPageIndex(page - 1)}
										isActive={table.getState().pagination.pageIndex === page - 1}
									>
										{page}
									</PaginationLink>
								</PaginationItem>
							),
						)}
						<PaginationItem>
							<PaginationNext
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	)
}
