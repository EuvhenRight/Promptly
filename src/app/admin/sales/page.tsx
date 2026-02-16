'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { SaleRecord, UserProfile } from '@/lib/types'
import { collection, query } from 'firebase/firestore'
import {
	CircleDollarSign,
	CreditCard,
	Loader2,
	Package,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

// Reusable StatCard component
function StatCard({
	title,
	value,
	icon: Icon,
	isLoading,
	format = 'number',
}: {
	title: string
	value: string | number
	icon: React.ElementType
	isLoading: boolean
	format?: 'number' | 'currency'
}) {
	const formattedValue = useMemo(() => {
		if (typeof value !== 'number') return value
		if (format === 'currency') {
			return new Intl.NumberFormat('de-DE', {
				style: 'currency',
				currency: 'EUR',
			}).format(value)
		}
		return value.toLocaleString()
	}, [value, format])

	return (
		<Card>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
				<CardTitle className='text-sm font-medium'>{title}</CardTitle>
				<Icon className='h-4 w-4 text-muted-foreground' />
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
				) : (
					<div className='text-2xl font-bold'>{formattedValue}</div>
				)}
			</CardContent>
		</Card>
	)
}

// Main Page Component
export default function AdminSalesPage() {
	const firestore = useFirestore()
	const [sales, setSales] = useState<SaleRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Fetch all users to map IDs to names
	const usersQuery = useMemoFirebase(
		() => (firestore ? query(collection(firestore, 'users')) : null),
		[firestore],
	)
	const { isLoading: usersLoading } = useCollection<UserProfile>(usersQuery)

	useEffect(() => {
		setLoading(true)
		setError(null)
		fetch('/api/admin/sales')
			.then(res => {
				if (!res.ok) {
					throw new Error('Failed to fetch sales data')
				}
				return res.json()
			})
			.then(data => {
				// The API returns dates as ISO strings, so we need to convert them back to Date objects
				const salesWithDates = data.map((sale: any) => ({
					...sale,
					createdAt: new Date(sale.createdAt),
				}))
				setSales(salesWithDates)
			})
			.catch(err => {
				setError(err.message)
				console.error(err)
			})
			.finally(() => {
				setLoading(false)
			})
	}, [])

	const {
		totalRevenue,
		platformEarnings,
		totalSalesCount,
		promptSalesCount,
	} = useMemo(() => {
		let totalRevenue = 0
		let platformEarnings = 0

		sales.forEach(sale => {
			if (sale.currency === 'eur') {
				totalRevenue += sale.revenueDetails.gross / 100 // Convert cents to EUR
				platformEarnings += sale.revenueDetails.platformFee / 100
			}
		})

		return {
			totalRevenue,
			platformEarnings,
			totalSalesCount: sales.length,
			promptSalesCount: sales.filter(
				s => s.type === 'prompt' || s.type === 'cart',
			).length,
		}
	}, [sales])

	const isLoading = loading || usersLoading

	if (error) {
		return <p className='text-destructive'>Error: {error}</p>
	}

	return (
		<div className='space-y-6'>
			<h1 className='text-lg font-semibold md:text-2xl'>Sales Dashboard</h1>
			<div className='grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4'>
				<StatCard
					title='Total Revenue'
					value={totalRevenue}
					icon={CircleDollarSign}
					isLoading={isLoading}
					format='currency'
				/>
				<StatCard
					title='Platform Earnings'
					value={platformEarnings}
					icon={CreditCard}
					isLoading={isLoading}
					format='currency'
				/>
				<StatCard
					title='Total Sales'
					value={totalSalesCount}
					icon={Package}
					isLoading={isLoading}
				/>
				<StatCard
					title='Prompts Sold'
					value={promptSalesCount}
					icon={Package}
					isLoading={isLoading}
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Recent Sales</CardTitle>
					<CardDescription>
						A list of the most recent transactions.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex justify-center py-8'>
							<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
						</div>
					) : (
						<p className='text-muted-foreground'>
							Sales table coming soon...
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
