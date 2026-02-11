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
import { ArrowUpDown, MoreHorizontal, Pencil, Trash } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

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
			const imageUrl = row.original.images?.[0]
			return imageUrl ? (
				<Image
					alt={row.original.title}
					className='aspect-square rounded-md object-cover'
					height='64'
					src={imageUrl}
					width='64'
					unoptimized
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
				<ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		),
		cell: ({ row }) => (
			<div className='font-medium'>{row.getValue('title')}</div>
		),
	},
	{
		accessorKey: 'price',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
			>
				Price
				<ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		),
		cell: ({ row }) => {
			const price = parseFloat(row.getValue('price'))
			const formatted = new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
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
				<ArrowUpDown className='ml-2 h-4 w-4' />
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
				<ArrowUpDown className='ml-2 h-4 w-4' />
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
				<ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		),
		cell: ({ row }) => (
			<div className='text-center'>
				{row.original.stats?.likes?.toLocaleString() ?? 0}
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
				<ArrowUpDown className='ml-2 h-4 w-4' />
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
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	})

	return (
		<div className='w-full'>
			<div className='flex items-center py-4'>
				<Input
					placeholder='Filter by title...'
					value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
					onChange={event =>
						table.getColumn('title')?.setFilterValue(event.target.value)
					}
					className='max-w-sm'
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='outline' className='ml-auto'>
							Columns <MoreHorizontal className='ml-2 h-4 w-4' />
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
										onCheckedChange={value => column.toggleVisibility(!!value)}
									>
										{column.id.replace('stats.', '')}
									</DropdownMenuCheckboxItem>
								)
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className='rounded-md border overflow-auto'>
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
				<div className='flex-1 text-sm text-muted-foreground'>
					{table.getFilteredSelectedRowModel().rows.length} of{' '}
					{table.getFilteredRowModel().rows.length} row(s) selected.
				</div>
				<div className='space-x-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	)
}
