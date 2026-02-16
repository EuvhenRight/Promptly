'use client'

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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import React from 'react'
import type { SaleRecord } from '@/lib/types'
import {
	ArrowUpDown,
	ChevronDown,
	Coins,
	Gift,
	Package,
	Star,
} from 'lucide-react'
import { format } from 'date-fns'

// This is the enriched type we'll use in the table
export type EnrichedSaleRecord = SaleRecord & {
	buyerDisplayName: string
	buyerPhotoURL?: string
	sellerDisplayName: string
	sellerPhotoURL?: string
	createdAt: Date // Overriding Timestamp with Date
}

const typeIconMap: Record<SaleRecord['type'], React.ElementType> = {
	prompt: Package,
	cart: Gift,
	credits: Coins,
	subscription: Star,
}

const typeLabelMap: Record<SaleRecord['type'], string> = {
	prompt: 'Prompt',
	cart: 'Cart',
	credits: 'Credits',
	subscription: 'Subscription',
}

const formatCurrency = (amount: number, currency: string) => {
	if (currency === 'crd') {
		return `${amount.toLocaleString()} credits`
	}
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: currency.toUpperCase(),
	}).format(amount / 100)
}

export const columns: ColumnDef<EnrichedSaleRecord>[] = [
	{
		accessorKey: 'createdAt',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
			>
				Date
				<ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		),
		cell: ({ row }) => format(row.getValue('createdAt'), 'PPP'),
	},
	{
		id: 'buyer',
		header: 'Buyer',
		accessorKey: 'buyerDisplayName',
		cell: ({ row }) => {
			const sale = row.original
			return (
				<div className='flex items-center gap-2'>
					<Avatar className='h-8 w-8'>
						<AvatarImage src={sale.buyerPhotoURL} />
						<AvatarFallback>{sale.buyerDisplayName.charAt(0)}</AvatarFallback>
					</Avatar>
					<span className='font-medium'>{sale.buyerDisplayName}</span>
				</div>
			)
		},
	},
	{
		accessorKey: 'type',
		header: 'Type',
		cell: ({ row }) => {
			const type = row.getValue('type') as SaleRecord['type']
			const Icon = typeIconMap[type]
			const label = typeLabelMap[type]
			return (
				<Badge variant='outline' className='capitalize'>
					<Icon className='mr-1 h-3 w-3' />
					{label}
				</Badge>
			)
		},
	},
	{
		id: 'details',
		header: 'Details',
		cell: ({ row }) => {
			const sale = row.original
			if (sale.type === 'prompt' || sale.type === 'cart') {
				return (
					<div
						className='max-w-xs truncate'
						title={sale.promptTitles?.join(', ')}
					>
						{sale.promptTitles?.join(', ') ?? 'N/A'}
					</div>
				)
			}
			if (sale.type === 'credits') {
				return `${sale.revenueDetails.gross} credits`
			}
			if (sale.type === 'subscription') {
				return `PRO Plan`
			}
			return 'N/A'
		},
	},
	{
		id: 'seller',
		header: 'Seller',
		accessorKey: 'sellerDisplayName',
		cell: ({ row }) => {
			const sale = row.original
			return (
				<div className='flex items-center gap-2'>
					{sale.sellerId ? (
						<>
							<Avatar className='h-8 w-8'>
								<AvatarImage src={sale.sellerPhotoURL} />
								<AvatarFallback>
									{sale.sellerDisplayName.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<span className='font-medium'>{sale.sellerDisplayName}</span>
						</>
					) : (
						<span className='text-muted-foreground'>Platform</span>
					)}
				</div>
			)
		},
	},
	{
		id: 'gross',
		header: () => <div className='text-right'>Gross</div>,
		cell: ({ row }) => (
			<div className='text-right'>
				{formatCurrency(
					row.original.revenueDetails.gross,
					row.original.currency,
				)}
			</div>
		),
	},
	{
		id: 'fee',
		header: () => <div className='text-right'>Platform Fee</div>,
		cell: ({ row }) => (
			<div className='text-right'>
				{formatCurrency(
					row.original.revenueDetails.platformFee,
					row.original.currency,
				)}
			</div>
		),
	},
	{
		id: 'earning',
		header: () => <div className='text-right'>Seller Earning</div>,
		cell: ({ row }) => (
			<div className='text-right'>
				{formatCurrency(
					row.original.revenueDetails.sellerEarning,
					row.original.currency,
				)}
			</div>
		),
	},
]

export function SalesTable({ sales }: { sales: EnrichedSaleRecord[] }) {
	const [sorting, setSorting] = React.useState<SortingState>([
		{ id: 'createdAt', desc: true },
	])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({})

	const table = useReactTable({
		data: sales,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
		},
	})

	return (
		<div className='w-full'>
			<div className='flex items-center gap-2 py-4'>
				<Input
					placeholder='Filter by buyer...'
					value={(table.getColumn('buyer')?.getFilterValue() as string) ?? ''}
					onChange={event =>
						table.getColumn('buyer')?.setFilterValue(event.target.value)
					}
					className='max-w-sm'
				/>
				<Select
					value={
						(table.getColumn('type')?.getFilterValue() as string) ?? 'all'
					}
					onValueChange={value => {
						table.getColumn('type')?.setFilterValue(value === 'all' ? '' : value)
					}}
				>
					<SelectTrigger className='w-[180px]'>
						<SelectValue placeholder='Filter by type' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>All Types</SelectItem>
						<SelectItem value='prompt'>Prompt</SelectItem>
						<SelectItem value='cart'>Cart</SelectItem>
						<SelectItem value='credits'>Credits</SelectItem>
						<SelectItem value='subscription'>Subscription</SelectItem>
					</SelectContent>
				</Select>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='outline' className='ml-auto'>
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
										onCheckedChange={value => column.toggleVisibility(!!value)}
									>
										{column.id}
									</DropdownMenuCheckboxItem>
								)
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
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
					{table.getFilteredRowModel().rows.length} row(s).
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
